import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SQL_SCHEMA, SUPABASE_TABLES } from "./src/lib/supabase-schema.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration
const rawSupabaseUrl = process.env.SUPABASE_URL || "https://zsirhvqjatpjulyllwtb.supabase.co";
const SUPABASE_URL = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_7YHCwaOUm9l56fAL2q5JBQ_kai71ofu";
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || "zsirhvqjatpjulyllwtb";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tableStatusCache: Record<string, { ready: boolean; timestamp: number }> = {};
const CACHE_TTL_MS = 10000;

async function isTableReadyInSupabase(table: string): Promise<boolean> {
  const cached = tableStatusCache[table];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.ready;
  }
  try {
    const queryCol = table === 'settings' ? 'key' : 'id';
    const { error } = await supabase.from(table).select(queryCol).limit(1);
    const ready = !(error && (error.code === 'PGRST205' || error.message?.includes('schema cache')));
    tableStatusCache[table] = { ready, timestamp: Date.now() };
    return ready;
  } catch {
    tableStatusCache[table] = { ready: false, timestamp: Date.now() };
    return false;
  }
}

const db = new Database("gelatoflow.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    cost REAL DEFAULT 0,
    price REAL NOT NULL,
    stock_quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL NOT NULL,
    payment_method TEXT NOT NULL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sale_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS sale_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    method TEXT NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'empleado',
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity_threshold INTEGER NOT NULL,
    promo_price REAL NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pos_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    label TEXT,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cash_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pos_point_id INTEGER,
    pos_point_name TEXT,
    user_id INTEGER,
    user_name TEXT,
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    initial_cash REAL NOT NULL DEFAULT 0,
    final_cash REAL,
    expected_cash REAL,
    difference REAL,
    total_cash_sales REAL DEFAULT 0,
    total_card_sales REAL DEFAULT 0,
    total_transfer_sales REAL DEFAULT 0,
    total_expenses REAL DEFAULT 0,
    total_sales REAL DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open',
    notes TEXT,
    FOREIGN KEY (pos_point_id) REFERENCES pos_points(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Default settings dictionary
const defaultSettings: Record<string, string> = {
  business_name: "Chuly Helados",
  business_subtitle: "Punto de Venta",
  business_address: "Av. San Martín 450",
  business_phone: "+54 9 11 4567-8900",
  currency_symbol: "$",
  low_stock_threshold: "10",
  tax_info: "IVA Responsable Inscripto",
  paper_width: "80mm",
  auto_print: "true",
  ticket_copies: "1",
  printer_target_notes: "Impresora Térmica Predeterminada (USB / Red / Default)",
  show_logo: "true",
  logo_url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=200&auto=format&fit=crop&q=80",
  header_title: "Chuly Helados",
  header_subtitle: "Punto de Venta - Comanda",
  footer_message: "¡Muchas gracias por elegirnos!",
  show_seller: "true",
  show_payment_details: "true",
  font_family: "mono",
  font_size: "normal",
  font_weight: "normal",
  line_spacing: "normal"
};

// Seed default settings if not exists
const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
for (const [key, val] of Object.entries(defaultSettings)) {
  insertSetting.run(key, val);
}

// Ensure user_id column exists if table was already created
try {
  db.prepare("ALTER TABLE sales ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE products ADD COLUMN cost REAL DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE sales ADD COLUMN pos_point_id INTEGER REFERENCES pos_points(id)").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE sales ADD COLUMN cash_shift_id INTEGER REFERENCES cash_shifts(id)").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE expenses ADD COLUMN cash_shift_id INTEGER REFERENCES cash_shifts(id)").run();
} catch (e) {}

// Seed default points of sale if empty
const posCount = db.prepare("SELECT COUNT(*) as count FROM pos_points").get() as { count: number };
if (posCount.count === 0) {
  const insertPos = db.prepare("INSERT INTO pos_points (name, label, description, active) VALUES (?, ?, ?, 1)");
  insertPos.run("Caja Principal", "POS-01", "Caja mostrador principal");
  insertPos.run("Caja Mostrador 2", "POS-02", "Terminal mostrador secundaria");
  insertPos.run("Tablet Barra", "TAB-01", "Terminal móvil para pedidos");
}

// Seed data if empty
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insertCat = db.prepare("INSERT INTO categories (name) VALUES (?)");
  insertCat.run("Helados por Peso");
  insertCat.run("Cucuruchos y Vasos");
  insertCat.run("Envasado");
  insertCat.run("Bebidas");
  insertCat.run("Toppings");
  insertCat.run("Otros");

  const insertProd = db.prepare("INSERT INTO products (name, category_id, price, stock_quantity, unit) VALUES (?, ?, ?, ?, ?)");
  insertProd.run("1kg Helado (3 sabores)", 1, 12000, 50, "kg");
  insertProd.run("1/2kg Helado (2 sabores)", 1, 6500, 30, "kg");
  insertProd.run("Cucurucho Simple", 2, 2500, 100, "un");
  insertProd.run("Vaso Grande", 2, 3500, 80, "un");
  insertProd.run("Agua Mineral 500ml", 3, 1200, 48, "un");

  const insertUser = db.prepare("INSERT INTO users (name, role, password) VALUES (?, ?, ?)");
  insertUser.run("Nahuel Zaine", "admin", "1234");
  insertUser.run("Juan Dueño", "admin", "1234");
  insertUser.run("Empleado 1", "empleado", "5678");
} else {
  // Ensure Nahuel Zaine exists even if already seeded
  const nahuel = db.prepare("SELECT * FROM users WHERE name = ?").get("Nahuel Zaine");
  if (!nahuel) {
    db.prepare("INSERT INTO users (name, role, password) VALUES (?, ?, ?)").run("Nahuel Zaine", "admin", "1234");
  }
  
  const envasado = db.prepare("SELECT * FROM categories WHERE name = ?").get("Envasado");
  if (!envasado) {
    db.prepare("INSERT INTO categories (name) VALUES (?)").run("Envasado");
  }

  const otros = db.prepare("SELECT * FROM categories WHERE name = ?").get("Otros");
  if (!otros) {
    db.prepare("INSERT INTO categories (name) VALUES (?)").run("Otros");
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Supabase Integration Routes
  app.get("/api/supabase/status", async (req, res) => {
    try {
      const tableChecks: Record<string, boolean> = {};
      for (const table of SUPABASE_TABLES) {
        try {
          const queryCol = table === 'settings' ? 'key' : 'id';
          const { error } = await supabase.from(table).select(queryCol).limit(1);
          const ready = !(error && (error.code === 'PGRST205' || error.message?.includes('schema cache')));
          tableChecks[table] = ready;
          tableStatusCache[table] = { ready, timestamp: Date.now() };
        } catch {
          tableChecks[table] = false;
          tableStatusCache[table] = { ready: false, timestamp: Date.now() };
        }
      }
      const readyCount = Object.values(tableChecks).filter(Boolean).length;
      res.json({
        configured: true,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        tables: tableChecks,
        readyCount,
        totalTables: SUPABASE_TABLES.length,
        allTablesReady: readyCount === SUPABASE_TABLES.length,
        sqlSchema: SUPABASE_SQL_SCHEMA
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/supabase/sync", async (req, res) => {
    try {
      const results: Record<string, any> = {};

      // 1. Categories
      if (await isTableReadyInSupabase('categories')) {
        const localCats = db.prepare("SELECT * FROM categories").all() as any[];
        for (const cat of localCats) {
          await supabase.from("categories").upsert({ id: cat.id, name: cat.name }, { onConflict: "id" });
        }
        results.categories = localCats.length;
      }

      // 2. Products
      if (await isTableReadyInSupabase('products')) {
        const localProds = db.prepare("SELECT * FROM products").all() as any[];
        for (const prod of localProds) {
          await supabase.from("products").upsert({
            id: prod.id,
            name: prod.name,
            category_id: prod.category_id,
            cost: prod.cost || 0,
            price: prod.price,
            stock_quantity: prod.stock_quantity || 0,
            unit: prod.unit || 'un'
          }, { onConflict: "id" });
        }
        results.products = localProds.length;
      }

      // 3. Users
      if (await isTableReadyInSupabase('users')) {
        const localUsers = db.prepare("SELECT * FROM users").all() as any[];
        for (const u of localUsers) {
          await supabase.from("users").upsert({
            id: u.id,
            name: u.name,
            role: u.role,
            password: u.password
          }, { onConflict: "id" });
        }
        results.users = localUsers.length;
      }

      // 4. Settings
      if (await isTableReadyInSupabase('settings')) {
        const localSettings = db.prepare("SELECT * FROM settings").all() as any[];
        for (const s of localSettings) {
          await supabase.from("settings").upsert({
            key: s.key,
            value: s.value
          }, { onConflict: "key" });
        }
        results.settings = localSettings.length;
      }

      // 5. Promotions
      if (await isTableReadyInSupabase('promotions')) {
        const localPromos = db.prepare("SELECT * FROM promotions").all() as any[];
        for (const p of localPromos) {
          await supabase.from("promotions").upsert({
            id: p.id,
            product_id: p.product_id,
            quantity_threshold: p.quantity_threshold,
            promo_price: p.promo_price
          }, { onConflict: "id" });
        }
        results.promotions = localPromos.length;
      }

      // 6. Expenses
      if (await isTableReadyInSupabase('expenses')) {
        const localExpenses = db.prepare("SELECT * FROM expenses").all() as any[];
        for (const exp of localExpenses) {
          await supabase.from("expenses").upsert({
            id: exp.id,
            description: exp.description,
            amount: exp.amount,
            payment_method: exp.payment_method,
            created_at: exp.created_at
          }, { onConflict: "id" });
        }
        results.expenses = localExpenses.length;
      }

      // 7. Sales
      if (await isTableReadyInSupabase('sales')) {
        const localSales = db.prepare("SELECT * FROM sales").all() as any[];
        for (const s of localSales) {
          await supabase.from("sales").upsert({
            id: s.id,
            total: s.total,
            payment_method: s.payment_method,
            user_id: s.user_id,
            created_at: s.created_at
          }, { onConflict: "id" });
        }
        results.sales = localSales.length;

        if (await isTableReadyInSupabase('sale_details')) {
          const localDetails = db.prepare("SELECT * FROM sale_details").all() as any[];
          for (const d of localDetails) {
            await supabase.from("sale_details").upsert({
              id: d.id,
              sale_id: d.sale_id,
              product_id: d.product_id,
              quantity: d.quantity,
              subtotal: d.subtotal
            }, { onConflict: "id" });
          }
        }

        if (await isTableReadyInSupabase('sale_payments')) {
          const localPayments = db.prepare("SELECT * FROM sale_payments").all() as any[];
          for (const p of localPayments) {
            await supabase.from("sale_payments").upsert({
              id: p.id,
              sale_id: p.sale_id,
              method: p.method,
              amount: p.amount
            }, { onConflict: "id" });
          }
        }
      }

      res.json({ success: true, synced: results });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // API Routes
  app.get("/api/products", async (req, res) => {
    try {
      if (await isTableReadyInSupabase('products')) {
        const { data, error } = await supabase
          .from("products")
          .select("*, categories(name)")
          .order("id");
        if (!error && data && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category_id: p.category_id,
            category_name: p.categories?.name || 'General',
            cost: Number(p.cost) || 0,
            price: Number(p.price),
            stock_quantity: Number(p.stock_quantity) || 0,
            unit: p.unit || 'un'
          }));
          return res.json(mapped);
        }
      }
    } catch (err) {
      console.warn("Supabase products fetch fallback:", err);
    }

    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id
    `).all();
    res.json(products);
  });

  app.get("/api/categories", async (req, res) => {
    try {
      if (await isTableReadyInSupabase('categories')) {
        const { data, error } = await supabase.from("categories").select("*").order("name");
        if (!error && data && data.length > 0) {
          return res.json(data);
        }
      }
    } catch (err) {
      console.warn("Supabase categories fetch fallback:", err);
    }

    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", async (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      const newId = Number(result.lastInsertRowid);

      if (await isTableReadyInSupabase('categories')) {
        try {
          await supabase.from("categories").upsert({ id: newId, name });
        } catch (e) {
          console.warn("Supabase category insert error:", e);
        }
      }

      res.json({ success: true, id: newId });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/sales", async (req, res) => {
    const { total, payments, items, user_id, pos_point_id } = req.body;
    
    // Check if open shift exists
    const openShift = db.prepare("SELECT id, pos_point_id FROM cash_shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1").get() as any;
    const shiftId = openShift ? openShift.id : null;
    const finalPosPointId = pos_point_id || (openShift ? openShift.pos_point_id : null);

    const transaction = db.transaction(() => {
      const paymentSummary = payments.map((p: any) => p.method).join(" + ");
      const saleResult = db.prepare("INSERT INTO sales (total, payment_method, user_id, pos_point_id, cash_shift_id) VALUES (?, ?, ?, ?, ?)").run(total, paymentSummary, user_id, finalPosPointId, shiftId);
      const saleId = Number(saleResult.lastInsertRowid);

      for (const item of items) {
        db.prepare("INSERT INTO sale_details (sale_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)")
          .run(saleId, item.id, item.quantity, item.price * item.quantity);
        
        // Update stock
        db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?")
          .run(item.quantity, item.id);
      }

      for (const payment of payments) {
        db.prepare("INSERT INTO sale_payments (sale_id, method, amount) VALUES (?, ?, ?)")
          .run(saleId, payment.method, payment.amount);
      }

      return saleId;
    });

    try {
      const id = transaction();

      // Asynchronously mirror to Supabase if tables exist
      (async () => {
        try {
          if (await isTableReadyInSupabase('sales')) {
            const paymentSummary = payments.map((p: any) => p.method).join(" + ");
            await supabase.from("sales").insert({
              id: id,
              total,
              payment_method: paymentSummary,
              user_id: user_id ? Number(user_id) : null
            });

            if (await isTableReadyInSupabase('sale_details')) {
              const details = items.map((item: any) => ({
                sale_id: id,
                product_id: Number(item.id),
                quantity: Number(item.quantity),
                subtotal: Number(item.price * item.quantity)
              }));
              await supabase.from("sale_details").insert(details);
            }

            if (await isTableReadyInSupabase('sale_payments')) {
              const paymentRows = payments.map((p: any) => ({
                sale_id: id,
                method: p.method,
                amount: Number(p.amount)
              }));
              await supabase.from("sale_payments").insert(paymentRows);
            }

            if (await isTableReadyInSupabase('products')) {
              for (const item of items) {
                const { data: prod } = await supabase.from("products").select("stock_quantity").eq("id", item.id).single();
                if (prod) {
                  await supabase.from("products").update({
                    stock_quantity: Math.max(0, (prod.stock_quantity || 0) - item.quantity)
                  }).eq("id", item.id);
                }
              }
            }
          }
        } catch (supabaseErr) {
          console.warn("Supabase sale mirror warning:", supabaseErr);
        }
      })();

      res.json({ success: true, saleId: id });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const sale = db.prepare(`
        SELECT s.*, u.name as seller_name 
        FROM sales s 
        LEFT JOIN users u ON s.user_id = u.id 
        WHERE s.id = ?
      `).get(id) as any;

      if (!sale) {
        return res.status(404).json({ error: "Venta no encontrada" });
      }

      const items = db.prepare(`
        SELECT sd.*, p.name as product_name, p.price, p.unit
        FROM sale_details sd
        JOIN products p ON sd.product_id = p.id
        WHERE sd.sale_id = ?
      `).all(id) as any[];

      const payments = db.prepare(`
        SELECT * FROM sale_payments WHERE sale_id = ?
      `).all(id) as any[];

      res.json({
        id: sale.id,
        total: sale.total,
        payment_method: sale.payment_method,
        user_id: sale.user_id,
        seller_name: sale.seller_name || "Desconocido",
        created_at: sale.created_at,
        items,
        payments
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    const { id } = req.params;
    const { user_id, payments, items } = req.body;
    try {
      const saleId = Number(id);
      const oldDetails = db.prepare("SELECT * FROM sale_details WHERE sale_id = ?").all(saleId) as any[];

      const newTotal = items.reduce((sum: number, it: any) => sum + Number(it.subtotal), 0);
      const paymentSummary = payments.map((p: any) => p.method).join(" + ");

      const updateTx = db.transaction(() => {
        // 1. Update sale record
        db.prepare("UPDATE sales SET total = ?, payment_method = ?, user_id = ? WHERE id = ?")
          .run(newTotal, paymentSummary, user_id ? Number(user_id) : null, saleId);

        // 2. Revert old items quantities back to stock
        for (const oldIt of oldDetails) {
          db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?")
            .run(oldIt.quantity, oldIt.product_id);
        }

        // 3. Clear and re-insert details, and decrement new quantities
        db.prepare("DELETE FROM sale_details WHERE sale_id = ?").run(saleId);
        for (const item of items) {
          db.prepare("INSERT INTO sale_details (sale_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)")
            .run(saleId, item.product_id, item.quantity, item.subtotal);
          db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?")
            .run(item.quantity, item.product_id);
        }

        // 4. Update payments
        db.prepare("DELETE FROM sale_payments WHERE sale_id = ?").run(saleId);
        for (const p of payments) {
          db.prepare("INSERT INTO sale_payments (sale_id, method, amount) VALUES (?, ?, ?)")
            .run(saleId, p.method, Number(p.amount));
        }
      });

      updateTx();

      // Asynchronously mirror updates to Supabase
      (async () => {
        try {
          if (await isTableReadyInSupabase('sales')) {
            await supabase.from('sales').update({
              total: newTotal,
              payment_method: paymentSummary,
              user_id: user_id ? Number(user_id) : null
            }).eq('id', saleId);

            if (await isTableReadyInSupabase('sale_details')) {
              await supabase.from('sale_details').delete().eq('sale_id', saleId);
              const detailRows = items.map((it: any) => ({
                sale_id: saleId,
                product_id: Number(it.product_id),
                quantity: Number(it.quantity),
                subtotal: Number(it.subtotal)
              }));
              await supabase.from('sale_details').insert(detailRows);
            }

            if (await isTableReadyInSupabase('sale_payments')) {
              await supabase.from('sale_payments').delete().eq('sale_id', saleId);
              const paymentRows = payments.map((p: any) => ({
                sale_id: saleId,
                method: p.method,
                amount: Number(p.amount)
              }));
              await supabase.from('sale_payments').insert(paymentRows);
            }

            if (await isTableReadyInSupabase('products')) {
              // Revert old items stock in Supabase
              for (const oldIt of oldDetails) {
                const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', oldIt.product_id).single();
                if (prod) {
                  await supabase.from('products').update({
                    stock_quantity: (prod.stock_quantity || 0) + oldIt.quantity
                  }).eq('id', oldIt.product_id);
                }
              }
              // Subtract new items stock in Supabase
              for (const item of items) {
                const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
                if (prod) {
                  await supabase.from('products').update({
                    stock_quantity: Math.max(0, (prod.stock_quantity || 0) - item.quantity)
                  }).eq('id', item.product_id);
                }
              }
            }
          }
        } catch (supabaseErr) {
          console.warn("Supabase update sale mirror warning:", supabaseErr);
        }
      })();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const saleId = Number(id);
      const details = db.prepare("SELECT * FROM sale_details WHERE sale_id = ?").all(saleId) as any[];

      const deleteTx = db.transaction(() => {
        // 1. Revert product stock
        for (const item of details) {
          db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?")
            .run(item.quantity, item.product_id);
        }
        // 2. Delete sale payments
        db.prepare("DELETE FROM sale_payments WHERE sale_id = ?").run(saleId);
        // 3. Delete sale details
        db.prepare("DELETE FROM sale_details WHERE sale_id = ?").run(saleId);
        // 4. Delete sale
        db.prepare("DELETE FROM sales WHERE id = ?").run(saleId);
      });

      deleteTx();

      // Asynchronously mirror deletion to Supabase
      (async () => {
        try {
          if (await isTableReadyInSupabase('sales')) {
            if (await isTableReadyInSupabase('products')) {
              for (const item of details) {
                const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
                if (prod) {
                  await supabase.from('products').update({
                    stock_quantity: (prod.stock_quantity || 0) + item.quantity
                  }).eq('id', item.product_id);
                }
              }
            }
            if (await isTableReadyInSupabase('sale_payments')) {
              await supabase.from('sale_payments').delete().eq('sale_id', saleId);
            }
            if (await isTableReadyInSupabase('sale_details')) {
              await supabase.from('sale_details').delete().eq('sale_id', saleId);
            }
            await supabase.from('sales').delete().eq('id', saleId);
          }
        } catch (supabaseErr) {
          console.warn("Supabase delete sale mirror warning:", supabaseErr);
        }
      })();

      res.json({ success: true, message: "Transacción eliminada y stock reintegrado correctamente" });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get("/api/reports/range", (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "Start and end dates are required" });
    }

    const salesReport = db.prepare(`
      SELECT 
        SUM(sp.amount) as total_sales,
        COUNT(DISTINCT s.id) as transaction_count,
        sp.method as payment_method
      FROM sales s
      JOIN sale_payments sp ON s.id = sp.sale_id
      WHERE date(s.created_at) BETWEEN date(?) AND date(?)
      GROUP BY sp.method
    `).all(start, end);

    const expensesTotal = db.prepare(`
      SELECT SUM(amount) as total_expenses
      FROM expenses
      WHERE date(created_at) BETWEEN date(?) AND date(?)
    `).get(start, end) as { total_expenses: number };

    const profitData = db.prepare(`
      SELECT 
        SUM(sd.subtotal) as total_revenue,
        SUM(sd.quantity * p.cost) as total_cost
      FROM sale_details sd
      JOIN products p ON sd.product_id = p.id
      JOIN sales s ON sd.sale_id = s.id
      WHERE date(s.created_at) BETWEEN date(?) AND date(?)
    `).get(start, end) as { total_revenue: number, total_cost: number };

    res.json({
      sales: salesReport,
      expenses: expensesTotal.total_expenses || 0,
      revenue: profitData.total_revenue || 0,
      cost: profitData.total_cost || 0
    });
  });

  app.get("/api/reports/daily", (req, res) => {
    const salesReport = db.prepare(`
      SELECT 
        SUM(sp.amount) as total_sales,
        COUNT(DISTINCT s.id) as transaction_count,
        sp.method as payment_method
      FROM sales s
      JOIN sale_payments sp ON s.id = sp.sale_id
      WHERE date(s.created_at) = date('now')
      GROUP BY sp.method
    `).all();

    const expensesTotal = db.prepare(`
      SELECT SUM(amount) as total_expenses
      FROM expenses
      WHERE date(created_at) = date('now')
    `).get() as { total_expenses: number };

    const profitData = db.prepare(`
      SELECT 
        SUM(sd.subtotal) as total_revenue,
        SUM(sd.quantity * p.cost) as total_cost
      FROM sale_details sd
      JOIN products p ON sd.product_id = p.id
      JOIN sales s ON sd.sale_id = s.id
      WHERE date(s.created_at) = date('now')
    `).get() as { total_revenue: number, total_cost: number };

    res.json({
      sales: salesReport,
      expenses: expensesTotal.total_expenses || 0,
      revenue: profitData.total_revenue || 0,
      cost: profitData.total_cost || 0
    });
  });

  app.get("/api/reports/transactions", (req, res) => {
    const { start, end } = req.query;
    let query = `
      SELECT 
        s.id as sale_id,
        sd.id as detail_id,
        sd.product_id,
        p.name as product_name,
        sd.quantity,
        sd.subtotal,
        p.price as unit_price,
        s.total as sale_total,
        s.user_id,
        (
          SELECT GROUP_CONCAT(method || ': $' || amount, ' | ')
          FROM sale_payments
          WHERE sale_id = s.id
        ) as payment_method,
        u.name as seller_name,
        s.created_at
      FROM sale_details sd
      JOIN sales s ON sd.sale_id = s.id
      JOIN products p ON sd.product_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
    `;
    
    let params: any[] = [];
    if (start && end) {
      query += " WHERE date(s.created_at) BETWEEN date(?) AND date(?) ";
      params = [start, end];
    } else {
      query += " WHERE date(s.created_at) = date('now') ";
    }
    
    query += " ORDER BY s.created_at DESC ";
    
    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  });

  app.post("/api/products", async (req, res) => {
    const { name, category_id, cost, price, stock_quantity, unit } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO products (name, category_id, cost, price, stock_quantity, unit)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, category_id, cost || 0, price, stock_quantity, unit || 'un');
      const newId = Number(result.lastInsertRowid);

      if (await isTableReadyInSupabase('products')) {
        try {
          await supabase.from("products").upsert({
            id: newId,
            name,
            category_id: category_id ? Number(category_id) : null,
            cost: Number(cost) || 0,
            price: Number(price),
            stock_quantity: Number(stock_quantity) || 0,
            unit: unit || 'un'
          }, { onConflict: "id" });
        } catch (e) {
          console.warn("Supabase product insert warning:", e);
        }
      }

      res.json({ success: true, id: newId });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const { name, cost, price, stock_quantity, category_id } = req.body;
    try {
      db.prepare(`
        UPDATE products 
        SET name = ?, cost = ?, price = ?, stock_quantity = ?, category_id = ?
        WHERE id = ?
      `).run(name, cost || 0, price, stock_quantity, category_id, id);

      if (await isTableReadyInSupabase('products')) {
        try {
          await supabase.from("products").update({
            name,
            cost: Number(cost) || 0,
            price: Number(price),
            stock_quantity: Number(stock_quantity) || 0,
            category_id: category_id ? Number(category_id) : null
          }).eq("id", Number(id));
        } catch (e) {
          console.warn("Supabase product update warning:", e);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get("/api/expenses", async (req, res) => {
    const { start, end } = req.query;

    if (await isTableReadyInSupabase('expenses')) {
      try {
        let query = supabase.from("expenses").select("*").order("created_at", { ascending: false });
        if (start && end) {
          query = query.gte("created_at", `${start}T00:00:00`).lte("created_at", `${end}T23:59:59`);
        }
        const { data, error } = await query;
        if (!error && data) {
          return res.json(data);
        }
      } catch (e) {
        console.warn("Supabase expenses fetch fallback:", e);
      }
    }

    let query = "SELECT * FROM expenses ";
    let params: any[] = [];
    
    if (start && end) {
      query += " WHERE date(created_at) BETWEEN date(?) AND date(?) ";
      params = [start, end];
    } else {
      query += " WHERE date(created_at) = date('now') ";
    }
    
    query += " ORDER BY created_at DESC ";
    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    const { description, amount, payment_method } = req.body;
    try {
      const openShift = db.prepare("SELECT id FROM cash_shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1").get() as any;
      const shiftId = openShift ? openShift.id : null;

      const result = db.prepare(`
        INSERT INTO expenses (description, amount, payment_method, cash_shift_id)
        VALUES (?, ?, ?, ?)
      `).run(description, amount, payment_method, shiftId);
      const newId = Number(result.lastInsertRowid);

      if (await isTableReadyInSupabase('expenses')) {
        try {
          await supabase.from("expenses").upsert({
            id: newId,
            description,
            amount: Number(amount),
            payment_method
          }, { onConflict: "id" });
        } catch (e) {
          console.warn("Supabase expense insert warning:", e);
        }
      }

      res.json({ success: true, id: newId });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get("/api/users", async (req, res) => {
    if (await isTableReadyInSupabase('users')) {
      try {
        const { data, error } = await supabase.from("users").select("id, name, role, password").order("id");
        if (!error && data && data.length > 0) {
          return res.json(data);
        }
      } catch (e) {
        console.warn("Supabase users fetch fallback:", e);
      }
    }

    const users = db.prepare("SELECT id, name, role, password FROM users").all();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    const { name, role, password } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO users (name, role, password)
        VALUES (?, ?, ?)
      `).run(name, role, password);
      const newId = Number(result.lastInsertRowid);

      if (await isTableReadyInSupabase('users')) {
        try {
          await supabase.from("users").upsert({
            id: newId,
            name,
            role,
            password
          }, { onConflict: "id" });
        } catch (e) {
          console.warn("Supabase user insert warning:", e);
        }
      }

      res.json({ success: true, id: newId });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { name, role, password } = req.body;
    try {
      db.prepare(`
        UPDATE users 
        SET name = ?, role = ?, password = ?
        WHERE id = ?
      `).run(name, role, password, id);

      if (await isTableReadyInSupabase('users')) {
        try {
          await supabase.from("users").update({
            name,
            role,
            password
          }).eq("id", Number(id));
        } catch (e) {
          console.warn("Supabase user update warning:", e);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);

      if (await isTableReadyInSupabase('users')) {
        try {
          await supabase.from("users").delete().eq("id", Number(id));
        } catch (e) {
          console.warn("Supabase user delete warning:", e);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get("/api/promotions", async (req, res) => {
    if (await isTableReadyInSupabase('promotions')) {
      try {
        const { data, error } = await supabase
          .from("promotions")
          .select("*, products(name)")
          .order("id");
        if (!error && data && data.length > 0) {
          const mapped = data.map((pr: any) => ({
            id: pr.id,
            product_id: pr.product_id,
            quantity_threshold: pr.quantity_threshold,
            promo_price: Number(pr.promo_price),
            product_name: pr.products?.name || ''
          }));
          return res.json(mapped);
        }
      } catch (e) {
        console.warn("Supabase promotions fallback:", e);
      }
    }

    const promotions = db.prepare(`
      SELECT pr.*, p.name as product_name 
      FROM promotions pr
      JOIN products p ON pr.product_id = p.id
    `).all();
    res.json(promotions);
  });

  app.post("/api/promotions", async (req, res) => {
    const { product_id, quantity_threshold, promo_price } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO promotions (product_id, quantity_threshold, promo_price)
        VALUES (?, ?, ?)
      `).run(product_id, quantity_threshold, promo_price);
      const newId = Number(result.lastInsertRowid);

      if (await isTableReadyInSupabase('promotions')) {
        try {
          await supabase.from("promotions").upsert({
            id: newId,
            product_id: Number(product_id),
            quantity_threshold: Number(quantity_threshold),
            promo_price: Number(promo_price)
          }, { onConflict: "id" });
        } catch (e) {
          console.warn("Supabase promotion insert warning:", e);
        }
      }

      res.json({ success: true, id: newId });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.delete("/api/promotions/:id", async (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM promotions WHERE id = ?").run(id);

      if (await isTableReadyInSupabase('promotions')) {
        try {
          await supabase.from("promotions").delete().eq("id", Number(id));
        } catch (e) {
          console.warn("Supabase promotion delete warning:", e);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POS Points Routes
  app.get("/api/pos-points", (req, res) => {
    try {
      const points = db.prepare("SELECT * FROM pos_points ORDER BY active DESC, id ASC").all();
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/pos-points", (req, res) => {
    const { name, label, description, active } = req.body;
    try {
      if (!name) return res.status(400).json({ error: "El nombre es obligatorio" });
      const result = db.prepare(
        "INSERT INTO pos_points (name, label, description, active) VALUES (?, ?, ?, ?)"
      ).run(name, label || "", description || "", active !== undefined ? (active ? 1 : 0) : 1);
      const newPoint = db.prepare("SELECT * FROM pos_points WHERE id = ?").get(result.lastInsertRowid);
      res.json(newPoint);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/pos-points/:id", (req, res) => {
    const { id } = req.params;
    const { name, label, description, active } = req.body;
    try {
      db.prepare(
        "UPDATE pos_points SET name = ?, label = ?, description = ?, active = ? WHERE id = ?"
      ).run(name, label || "", description || "", active ? 1 : 0, id);
      const updated = db.prepare("SELECT * FROM pos_points WHERE id = ?").get(id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/pos-points/:id", (req, res) => {
    const { id } = req.params;
    try {
      const salesCount = db.prepare("SELECT COUNT(*) as count FROM sales WHERE pos_point_id = ?").get(id) as any;
      if (salesCount && salesCount.count > 0) {
        db.prepare("UPDATE pos_points SET active = 0 WHERE id = ?").run(id);
        return res.json({ success: true, deactivated: true, message: "Punto de venta desactivado" });
      }
      db.prepare("DELETE FROM pos_points WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Cash Register / Shifts helper
  const calculateShiftStats = (shift: any) => {
    const openedAt = shift.opened_at;
    const closedAt = shift.closed_at || new Date().toISOString();

    const payments = db.prepare(`
      SELECT sp.method, SUM(sp.amount) as total, COUNT(DISTINCT s.id) as trans_count
      FROM sale_payments sp
      JOIN sales s ON sp.sale_id = s.id
      WHERE (s.cash_shift_id = ? OR (s.cash_shift_id IS NULL AND s.created_at >= ? AND s.created_at <= ?))
      GROUP BY sp.method
    `).all(shift.id, openedAt, closedAt) as any[];

    let cashSales = 0;
    let cardSales = 0;
    let transferSales = 0;

    for (const p of payments) {
      const m = (p.method || "").toLowerCase();
      if (m.includes("efectivo")) cashSales += Number(p.total) || 0;
      else if (m.includes("tarjeta")) cardSales += Number(p.total) || 0;
      else if (m.includes("transfer")) transferSales += Number(p.total) || 0;
      else cashSales += Number(p.total) || 0;
    }

    const expenses = db.prepare(`
      SELECT SUM(amount) as total
      FROM expenses
      WHERE (cash_shift_id = ? OR (cash_shift_id IS NULL AND created_at >= ? AND created_at <= ?))
    `).get(shift.id, openedAt, closedAt) as any;
    const totalExpenses = Number(expenses?.total) || 0;

    const totalTx = db.prepare(`
      SELECT COUNT(id) as count, SUM(total) as total
      FROM sales
      WHERE (cash_shift_id = ? OR (cash_shift_id IS NULL AND created_at >= ? AND created_at <= ?))
    `).get(shift.id, openedAt, closedAt) as any;

    const totalSales = Number(totalTx?.total) || (cashSales + cardSales + transferSales);
    const transactionCount = Number(totalTx?.count) || 0;
    const initialCash = Number(shift.initial_cash) || 0;
    const expectedCash = initialCash + cashSales - totalExpenses;

    return {
      initial_cash: initialCash,
      total_cash_sales: cashSales,
      total_card_sales: cardSales,
      total_transfer_sales: transferSales,
      total_expenses: totalExpenses,
      total_sales: totalSales,
      transaction_count: transactionCount,
      expected_cash: expectedCash
    };
  };

  app.get("/api/cash-shift/current", (req, res) => {
    try {
      const shift = db.prepare(`
        SELECT cs.*, p.name as pos_point_name, p.label as pos_point_label
        FROM cash_shifts cs
        LEFT JOIN pos_points p ON cs.pos_point_id = p.id
        WHERE cs.status = 'open'
        ORDER BY cs.id DESC
        LIMIT 1
      `).get() as any;

      if (!shift) {
        return res.json({ isOpen: false, shift: null });
      }

      const stats = calculateShiftStats(shift);
      res.json({
        isOpen: true,
        shift: {
          ...shift,
          ...stats
        }
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/cash-shift/open", (req, res) => {
    const { initial_cash, pos_point_id, user_id, notes } = req.body;
    try {
      const existingOpen = db.prepare("SELECT * FROM cash_shifts WHERE status = 'open' LIMIT 1").get() as any;
      if (existingOpen) {
        return res.status(400).json({ error: "Ya existe un turno de caja abierto. Ciérralo antes de abrir uno nuevo." });
      }

      const user = user_id ? db.prepare("SELECT name FROM users WHERE id = ?").get(user_id) as any : null;
      const pos = pos_point_id ? db.prepare("SELECT name FROM pos_points WHERE id = ?").get(pos_point_id) as any : null;

      const result = db.prepare(`
        INSERT INTO cash_shifts (pos_point_id, pos_point_name, user_id, user_name, initial_cash, status, notes)
        VALUES (?, ?, ?, ?, ?, 'open', ?)
      `).run(
        pos_point_id || null,
        pos?.name || "Caja Principal",
        user_id || null,
        user?.name || "Cajero",
        Number(initial_cash) || 0,
        notes || ""
      );

      const created = db.prepare("SELECT * FROM cash_shifts WHERE id = ?").get(result.lastInsertRowid) as any;
      const stats = calculateShiftStats(created);
      res.json({ success: true, shift: { ...created, ...stats } });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/cash-shift/close", (req, res) => {
    const { shift_id, final_cash, notes } = req.body;
    try {
      const shift = db.prepare("SELECT * FROM cash_shifts WHERE id = ?").get(shift_id) as any;
      if (!shift) {
        return res.status(404).json({ error: "Turno de caja no encontrado" });
      }
      if (shift.status === 'closed') {
        return res.status(400).json({ error: "Este turno de caja ya ha sido cerrado" });
      }

      const stats = calculateShiftStats(shift);
      const countedCash = Number(final_cash) || 0;
      const difference = countedCash - stats.expected_cash;

      db.prepare(`
        UPDATE cash_shifts SET
          closed_at = CURRENT_TIMESTAMP,
          final_cash = ?,
          expected_cash = ?,
          difference = ?,
          total_cash_sales = ?,
          total_card_sales = ?,
          total_transfer_sales = ?,
          total_expenses = ?,
          total_sales = ?,
          transaction_count = ?,
          status = 'closed',
          notes = CASE WHEN ? != '' THEN ? ELSE notes END
        WHERE id = ?
      `).run(
        countedCash,
        stats.expected_cash,
        difference,
        stats.total_cash_sales,
        stats.total_card_sales,
        stats.total_transfer_sales,
        stats.total_expenses,
        stats.total_sales,
        stats.transaction_count,
        notes || "",
        notes || "",
        shift_id
      );

      const closedShift = db.prepare("SELECT * FROM cash_shifts WHERE id = ?").get(shift_id) as any;
      res.json({
        success: true,
        shift: {
          ...closedShift,
          ...stats,
          final_cash: countedCash,
          difference: difference
        },
        message: "Caja cerrada correctamente"
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/cash-shifts", (req, res) => {
    try {
      const shifts = db.prepare("SELECT * FROM cash_shifts ORDER BY id DESC LIMIT 50").all();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      if (await isTableReadyInSupabase('settings')) {
        const { data, error } = await supabase.from("settings").select("key, value");
        if (!error && data && data.length > 0) {
          const settingsObj: Record<string, any> = {};
          for (const row of data) {
            if (row.value === "true") settingsObj[row.key] = true;
            else if (row.value === "false") settingsObj[row.key] = false;
            else if (!isNaN(Number(row.value)) && row.value.trim() !== "" && row.key !== "business_phone" && row.key !== "paper_width") {
              settingsObj[row.key] = Number(row.value);
            } else {
              settingsObj[row.key] = row.value;
            }
          }
          return res.json(settingsObj);
        }
      }
    } catch (e) {
      console.warn("Supabase settings fallback:", e);
    }

    try {
      const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string, value: string }[];
      const settingsObj: Record<string, any> = {};
      for (const row of rows) {
        if (row.value === "true") settingsObj[row.key] = true;
        else if (row.value === "false") settingsObj[row.key] = false;
        else if (!isNaN(Number(row.value)) && row.value.trim() !== "" && row.key !== "business_phone" && row.key !== "paper_width") {
          settingsObj[row.key] = Number(row.value);
        } else {
          settingsObj[row.key] = row.value;
        }
      }
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    const newSettings = req.body;
    try {
      const upsert = db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);

      const updateAll = db.transaction(() => {
        for (const [key, val] of Object.entries(newSettings)) {
          upsert.run(key, String(val));
        }
      });

      updateAll();

      if (await isTableReadyInSupabase('settings')) {
        try {
          const records = Object.entries(newSettings).map(([key, val]) => ({
            key,
            value: String(val)
          }));
          await supabase.from("settings").upsert(records, { onConflict: "key" });
        } catch (e) {
          console.warn("Supabase settings upsert warning:", e);
        }
      }

      // Return refreshed settings
      const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string, value: string }[];
      const settingsObj: Record<string, any> = {};
      for (const row of rows) {
        if (row.value === "true") settingsObj[row.key] = true;
        else if (row.value === "false") settingsObj[row.key] = false;
        else if (!isNaN(Number(row.value)) && row.value.trim() !== "" && row.key !== "business_phone" && row.key !== "paper_width") {
          settingsObj[row.key] = Number(row.value);
        } else {
          settingsObj[row.key] = row.value;
        }
      }
      res.json({ success: true, settings: settingsObj });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GelatoFlow Server running on http://localhost:${PORT}`);
  });
}

startServer();
