// Mock Supabase Client Provider untuk Mode Demo Instant & Fallback Jaringan
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_EXTRAS,
  INITIAL_TABLES,
  INITIAL_INGREDIENTS,
  DEMO_PROFILES,
  INITIAL_SESSIONS,
} from './mockData';

// LocalStorage Persistence Keys
const KEY_PRODUCTS = 'rg_mock_products_v2';
const KEY_TABLES = 'rg_mock_tables_v2';
const KEY_INGREDIENTS = 'rg_mock_ingredients_v2';
const KEY_SESSIONS = 'rg_mock_sessions_v2';
const KEY_REQUESTS = 'rg_mock_requests_v2';
const KEY_PAYMENTS = 'rg_mock_payments_v2';
const KEY_AUTH_USER = 'rg_mock_auth_user_v2';

const readStore = <T>(key: string, initial: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initial;
  } catch {
    return initial;
  }
};

const writeStore = (key: string, val: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

export class MockSupabaseClient {
  private products = readStore(KEY_PRODUCTS, INITIAL_PRODUCTS);
  private categories = INITIAL_CATEGORIES;
  private extras = INITIAL_EXTRAS;
  private tables = readStore(KEY_TABLES, INITIAL_TABLES);
  private ingredients = readStore(KEY_INGREDIENTS, INITIAL_INGREDIENTS);
  private sessions = readStore(KEY_SESSIONS, INITIAL_SESSIONS);
  private serviceRequests = readStore(KEY_REQUESTS, []);
  private payments = readStore(KEY_PAYMENTS, []);
  private authUser = readStore(KEY_AUTH_USER, DEMO_PROFILES[0]);

  auth = {
    getSession: async () => ({
      data: {
        session: this.authUser
          ? { user: { id: this.authUser.id, email: this.authUser.email } }
          : null,
      },
      error: null,
    }),
    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      const match = DEMO_PROFILES.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
      if (match) {
        this.authUser = match;
        writeStore(KEY_AUTH_USER, match);
        return { data: { user: { id: match.id, email: match.email } }, error: null };
      }
      return { data: { user: null }, error: { message: 'Email atau password tidak ditemukan di akun demo.' } };
    },
    signOut: async () => {
      this.authUser = null;
      localStorage.removeItem(KEY_AUTH_USER);
      return { error: null };
    },
  };

  from(table: string) {
    const self = this;
    return {
      select: (_cols?: string) => {
        let chainData: any[] = [];
        if (table === 'categories') chainData = self.categories;
        else if (table === 'products') chainData = self.products;
        else if (table === 'extras') chainData = self.extras;
        else if (table === 'tables') chainData = self.tables;
        else if (table === 'ingredients') chainData = self.ingredients;
        else if (table === 'table_sessions') chainData = self.sessions;
        else if (table === 'service_requests') chainData = self.serviceRequests;
        else if (table === 'payments') chainData = self.payments;
        else if (table === 'profiles') chainData = DEMO_PROFILES;

        const builder: any = {
          data: chainData,
          error: null,
          eq: (field: string, val: any) => {
            builder.data = builder.data.filter((row: any) => row[field] === val);
            return builder;
          },
          is: (field: string, val: any) => {
            builder.data = builder.data.filter((row: any) => (val === null ? row[field] == null : row[field] === val));
            return builder;
          },
          gte: (field: string, val: any) => {
            builder.data = builder.data.filter((row: any) => row[field] >= val);
            return builder;
          },
          order: (_field: string, _opts?: any) => builder,
          single: async () => ({ data: builder.data[0] || null, error: builder.data[0] ? null : { message: 'Not found' } }),
          maybeSingle: async () => ({ data: builder.data[0] || null, error: null }),
          then: (resolve: any) => resolve({ data: builder.data, error: null }),
        };
        return builder;
      },
      insert: (rows: any | any[]) => {
        const arr = Array.isArray(rows) ? rows : [rows];
        if (table === 'tables') {
          arr.forEach((r, idx) => {
            const newTbl = { table_id: Date.now() + idx, table_number: r.table_number, capacity: r.capacity || 2, area: r.area || 'Utama', qr_token: `tbl_token_meja_${r.table_number}`, is_active: true };
            self.tables.push(newTbl);
          });
          writeStore(KEY_TABLES, self.tables);
        } else if (table === 'products') {
          arr.forEach((r, idx) => {
            const cat = self.categories.find((c) => c.category_id === r.category_id)?.name || 'Lainnya';
            const newProd = { ...r, product_id: Date.now() + idx, product_code: r.product_code || `P${Date.now()}`, categories: { name: cat }, image_url: r.image_url || '' };
            self.products.push(newProd);
          });
          writeStore(KEY_PRODUCTS, self.products);
        } else if (table === 'ingredients') {
          arr.forEach((r, idx) => {
            const newIng = { ...r, ingredient_id: Date.now() + idx, last_restocked: new Date().toISOString() };
            self.ingredients.push(newIng);
          });
          writeStore(KEY_INGREDIENTS, self.ingredients);
        }
        return {
          select: () => ({
            single: async () => ({ data: arr[0] || {}, error: null }),
            then: (resolve: any) => resolve({ data: arr, error: null }),
          }),
          then: (resolve: any) => resolve({ data: arr, error: null }),
        };
      },
      update: (patch: any) => ({
        eq: (field: string, val: any) => {
          if (table === 'tables') {
            self.tables = self.tables.map((t) => (t[field] === val ? { ...t, ...patch } : t));
            writeStore(KEY_TABLES, self.tables);
          } else if (table === 'products') {
            self.products = self.products.map((p) => (p[field] === val ? { ...p, ...patch } : p));
            writeStore(KEY_PRODUCTS, self.products);
          } else if (table === 'ingredients') {
            self.ingredients = self.ingredients.map((i) => (i[field] === val ? { ...i, ...patch } : i));
            writeStore(KEY_INGREDIENTS, self.ingredients);
          }
          return Promise.resolve({ data: null, error: null });
        },
      }),
      delete: () => ({
        eq: (field: string, val: any) => {
          if (table === 'tables') {
            self.tables = self.tables.filter((t) => t[field] !== val);
            writeStore(KEY_TABLES, self.tables);
          } else if (table === 'products') {
            self.products = self.products.filter((p) => p[field] !== val);
            writeStore(KEY_PRODUCTS, self.products);
          } else if (table === 'ingredients') {
            self.ingredients = self.ingredients.filter((i) => i[field] !== val);
            writeStore(KEY_INGREDIENTS, self.ingredients);
          }
          return Promise.resolve({ data: null, error: null });
        },
      }),
    };
  }

  async rpc(fn: string, params?: any) {
    if (fn === 'get_table') {
      const token = params?.p_token || 'tbl_token_meja_08';
      const tbl = this.tables.find((t) => t.qr_token === token) || this.tables[0];
      return { data: tbl ? [{ table_number: tbl.table_number, area: tbl.area }] : [], error: null };
    }

    if (fn === 'my_orders') {
      const token = params?.p_token || 'tbl_token_meja_08';
      const tbl = this.tables.find((t) => t.qr_token === token) || this.tables[0];
      const sess = this.sessions.find((s) => s.table_id === tbl.table_id && !s.closed_at);
      return { data: sess?.orders || [], error: null };
    }

    if (fn === 'place_order') {
      const token = params?.p_token || 'tbl_token_meja_08';
      const tbl = this.tables.find((t) => t.qr_token === token) || this.tables[0];
      let sess = this.sessions.find((s) => s.table_id === tbl.table_id && !s.closed_at);
      if (!sess) {
        sess = {
          session_id: Date.now(),
          table_id: tbl.table_id,
          guest_count: params?.p_guests || 2,
          customer_name: `Pelanggan Meja ${tbl.table_number}`,
          opened_at: new Date().toISOString(),
          closed_at: null,
          orders: [],
        };
        this.sessions.push(sess);
      }

      const orderItems = (params?.p_items || []).map((item: any, idx: number) => {
        const prod = this.products.find((p) => p.product_id === item.id);
        const price = prod ? prod.price : 20000;
        return {
          order_item_id: Date.now() + idx,
          product_id: item.id,
          product_name: prod ? prod.name : 'Menu Pesanan',
          unit_price: price,
          quantity: item.qty,
          note: item.note || '',
        };
      });

      const subtotal = orderItems.reduce((a: number, i: any) => a + i.unit_price * i.quantity, 0);
      const total = Math.round(subtotal * 1.155);

      const newOrder = {
        order_id: Date.now(),
        order_number: `A${String(Math.floor(Math.random() * 9000) + 1000)}`,
        order_status: 'submitted',
        order_source: 'qr',
        total,
        note: params?.p_note || '',
        created_at: new Date().toISOString(),
        ready_at: null,
        served_at: null,
        profiles: { full_name: `QR Meja ${tbl.table_number}` },
        order_items: orderItems,
      };

      sess.orders.push(newOrder);
      writeStore(KEY_SESSIONS, this.sessions);
      return { data: { success: true }, error: null };
    }

    if (fn === 'staff_place_order') {
      const tableId = params?.p_table_id;
      let sess = this.sessions.find((s) => s.table_id === tableId && !s.closed_at);
      if (!sess) {
        sess = {
          session_id: Date.now(),
          table_id: tableId,
          guest_count: params?.p_guests || 2,
          customer_name: params?.p_customer || 'Pelanggan',
          opened_at: new Date().toISOString(),
          closed_at: null,
          orders: [],
        };
        this.sessions.push(sess);
      }

      const orderItems = (params?.p_items || []).map((item: any, idx: number) => {
        const prod = this.products.find((p) => p.product_id === item.id);
        return {
          order_item_id: Date.now() + idx,
          product_id: item.id,
          product_name: prod ? prod.name : 'Menu Pesanan',
          unit_price: prod ? prod.price : 20000,
          quantity: item.qty,
          note: item.note || '',
        };
      });

      const subtotal = orderItems.reduce((a: number, i: any) => a + i.unit_price * i.quantity, 0);
      const total = Math.round(subtotal * 1.155);

      const newOrder = {
        order_id: Date.now(),
        order_number: `A${String(Math.floor(Math.random() * 9000) + 1000)}`,
        order_status: params?.p_draft ? 'draft' : 'preparing',
        order_source: 'staff',
        total,
        note: params?.p_note || '',
        created_at: new Date().toISOString(),
        ready_at: null,
        served_at: null,
        profiles: { full_name: this.authUser?.full_name || 'Staf Kasir' },
        order_items: orderItems,
      };

      sess.orders.push(newOrder);
      writeStore(KEY_SESSIONS, this.sessions);
      return { data: { success: true }, error: null };
    }

    if (fn === 'request_service') {
      const token = params?.p_token;
      const tbl = this.tables.find((t) => t.qr_token === token) || this.tables[0];
      const newReq = {
        request_id: Date.now(),
        table_id: tbl.table_id,
        kind: params?.p_kind || 'waiter',
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      this.serviceRequests.push(newReq);
      writeStore(KEY_REQUESTS, this.serviceRequests);
      return { data: { success: true }, error: null };
    }

    if (fn === 'advance_order') {
      const orderId = params?.p_order;
      for (const sess of this.sessions) {
        const order = sess.orders.find((o: any) => o.order_id === orderId);
        if (order) {
          if (order.order_status === 'submitted') order.order_status = 'preparing';
          else if (order.order_status === 'preparing') {
            order.order_status = 'ready';
            order.ready_at = new Date().toISOString();
          } else if (order.order_status === 'ready') {
            order.order_status = 'served';
            order.served_at = new Date().toISOString();
          }
          writeStore(KEY_SESSIONS, this.sessions);
          break;
        }
      }
      return { data: { success: true }, error: null };
    }

    if (fn === 'pay_session') {
      const sessionId = params?.p_session;
      const sess = this.sessions.find((s) => s.session_id === sessionId);
      if (!sess) return { data: { error: 'Sesi tidak ditemukan' }, error: null };

      const subtotal = sess.orders.reduce((a: number, o: any) => a + o.total, 0);
      const rec = params?.p_received || subtotal;
      const change = Math.max(0, rec - subtotal);

      const payment = {
        payment_id: Date.now(),
        transaction_code: `TRX-${Date.now().toString().slice(-6)}`,
        method: params?.p_method || 'cash',
        amount: subtotal,
        cash_received: rec,
        change_amount: change,
        status: 'paid',
        paid_at: new Date().toISOString(),
        orders: sess.orders[0] || {},
      };

      this.payments.unshift(payment);
      sess.closed_at = new Date().toISOString();
      writeStore(KEY_PAYMENTS, this.payments);
      writeStore(KEY_SESSIONS, this.sessions);

      return { data: { success: true, change }, error: null };
    }

    return { data: null, error: null };
  }

  channel(_name: string) {
    return {
      on: (_event: string, _opts: any, _callback: any) => this.channel(_name),
      subscribe: () => ({ unsubscribe: () => {} }),
    };
  }

  removeChannel(_ch: any) {}
}
