-- Migration untuk menambahkan tabel-tabel sistem invoice UMKM
-- Termasuk: profiles, clients, invoices, invoice_items

-- Tipe data untuk status invoice dan subscription tier
create type "public"."subscription_tier" as enum ('tier1', 'tier2');
create type "public"."invoice_status" as enum ('draft', 'sent', 'paid', 'partial', 'overdue');

-- Tabel profiles untuk extend Clerk users dengan informasi subscription
create table "public"."profiles" (
    "id" uuid not null default gen_random_uuid(),
    "clerk_user_id" text unique not null,
    "email" text not null,
    "name" text,
    "subscription_tier" subscription_tier default 'tier1',
    "business_name" text,
    "business_logo" text,
    "business_address" text,
    "business_phone" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Tabel clients untuk menyimpan data klien
create table "public"."clients" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" text not null,
    "name" text not null,
    "company" text,
    "email" text,
    "whatsapp" text,
    "address" text,
    "phone" text,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Tabel invoices untuk menyimpan data invoice
create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" text not null,
    "client_id" uuid not null,
    "invoice_number" text not null,
    "status" invoice_status default 'draft',
    "issue_date" date not null default timezone('utc'::text, now())::date,
    "due_date" date not null default (timezone('utc'::text, now()) + interval '30 days')::date,
    "currency" text not null default 'IDR',
    "subtotal" bigint not null default 0,
    "tax_rate" real not null default 0,
    "tax_amount" bigint not null default 0,
    "total" bigint not null default 0,
    "notes" text,
    "payment_method" text,
    "payment_date" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Tabel invoice_items untuk menyimpan detail item invoice
create table "public"."invoice_items" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" uuid not null,
    "description" text not null,
    "quantity" real not null default 1,
    "unit_price" bigint not null,
    "total" bigint not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table "public"."profiles" enable row level security;
alter table "public"."clients" enable row level security;
alter table "public"."invoices" enable row level security;
alter table "public"."invoice_items" enable row level security;

-- Create indexes for better performance
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX profiles_clerk_user_id_key ON public.profiles USING btree (clerk_user_id);
CREATE INDEX profiles_email_idx ON public.profiles USING btree (email);

CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (id);
CREATE INDEX clients_user_id_idx ON public.clients USING btree (user_id);
CREATE INDEX clients_email_idx ON public.clients USING btree (email);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);
CREATE INDEX invoices_user_id_idx ON public.invoices USING btree (user_id);
CREATE INDEX invoices_client_id_idx ON public.invoices USING btree (client_id);
CREATE INDEX invoices_status_idx ON public.invoices USING btree (status);
CREATE INDEX invoices_invoice_number_idx ON public.invoices USING btree (invoice_number);
CREATE INDEX invoices_due_date_idx ON public.invoices USING btree (due_date);

CREATE UNIQUE INDEX invoice_items_pkey ON public.invoice_items USING btree (id);
CREATE INDEX invoice_items_invoice_id_idx ON public.invoice_items USING btree (invoice_id);

-- Add primary key constraints
alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";
alter table "public"."clients" add constraint "clients_pkey" PRIMARY KEY using index "clients_pkey";
alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";
alter table "public"."invoice_items" add constraint "invoice_items_pkey" PRIMARY KEY using index "invoice_items_pkey";

-- Add foreign key constraints
alter table "public"."clients" add constraint "clients_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(clerk_user_id) on delete cascade not valid;
alter table "public"."invoices" add constraint "invoices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(clerk_user_id) on delete cascade not valid;
alter table "public"."invoices" add constraint "invoices_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) on delete cascade not valid;
alter table "public"."invoice_items" add constraint "invoice_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) on delete cascade not valid;

-- Validate constraints
alter table "public"."clients" validate constraint "clients_user_id_fkey";
alter table "public"."invoices" validate constraint "invoices_user_id_fkey";
alter table "public"."invoices" validate constraint "invoices_client_id_fkey";
alter table "public"."invoice_items" validate constraint "invoice_items_invoice_id_fkey";

-- Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    month_part text;
    year_part text;
    sequence_num text;
    invoice_number text;
BEGIN
    -- Format: INV/YYYYMM/0001
    month_part := to_char(now(), 'MM');
    year_part := to_char(now(), 'YYYY');

    -- Get next sequence for this month
    SELECT LPAD(COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '/', 3) AS integer)), 0) + 1::text, 4, '0')
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'INV/' || year_part || '/' || month_part || '/%';

    invoice_number := 'INV/' || year_part || '/' || month_part || '/' || sequence_num;

    RETURN invoice_number;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger for auto-generating invoice number
CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON invoices FOR EACH ROW WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '') EXECUTE FUNCTION generate_invoice_number();

-- Function to recalculate invoice totals when invoice items change
CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invoice_uuid uuid;
BEGIN
    -- Get invoice_id from the changed row
    IF TG_OP = 'DELETE' THEN
        invoice_uuid := OLD.invoice_id;
    ELSE
        invoice_uuid := NEW.invoice_id;
    END IF;

    -- Update the invoice with new totals
    UPDATE invoices
    SET
        subtotal = COALESCE(
            (SELECT COALESCE(SUM(total), 0)
             FROM invoice_items
             WHERE invoice_id = invoice_uuid), 0
        ),
        updated_at = timezone('utc'::text, now())
    WHERE id = invoice_uuid;

    -- Return appropriate value based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Function to update invoice tax and grand total
CREATE OR REPLACE FUNCTION public.update_invoice_tax_and_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Calculate tax amount and grand total
    NEW.tax_amount = ROUND(NEW.subtotal * (NEW.tax_rate / 100.0));
    NEW.total = NEW.subtotal + NEW.tax_amount;

    RETURN NEW;
END;
$$;

-- Triggers
CREATE TRIGGER recalculate_invoice_totals_trigger AFTER INSERT OR UPDATE OR DELETE ON invoice_items FOR EACH ROW EXECUTE FUNCTION recalculate_invoice_totals();
CREATE TRIGGER update_invoice_tax_and_total_trigger BEFORE UPDATE OF subtotal, tax_rate ON invoices FOR EACH ROW EXECUTE FUNCTION update_invoice_tax_and_total();

-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (clerk_user_id = requesting_user_id());
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (clerk_user_id = requesting_user_id());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (clerk_user_id = requesting_user_id());

-- Clients policies
CREATE POLICY "Users can view their own clients" ON clients FOR SELECT USING (user_id = requesting_user_id());
CREATE POLICY "Users can insert their own clients" ON clients FOR INSERT WITH CHECK (user_id = requesting_user_id());
CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (user_id = requesting_user_id());
CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (user_id = requesting_user_id());

-- Invoices policies
CREATE POLICY "Users can view their own invoices" ON invoices FOR SELECT USING (user_id = requesting_user_id());
CREATE POLICY "Users can insert their own invoices" ON invoices FOR INSERT WITH CHECK (user_id = requesting_user_id());
CREATE POLICY "Users can update their own invoices" ON invoices FOR UPDATE USING (user_id = requesting_user_id());
CREATE POLICY "Users can delete their own invoices" ON invoices FOR DELETE USING (user_id = requesting_user_id());

-- Invoice items policies
CREATE POLICY "Users can view their own invoice items" ON invoice_items FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = requesting_user_id())
);
CREATE POLICY "Users can insert their own invoice items" ON invoice_items FOR INSERT WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = requesting_user_id())
);
CREATE POLICY "Users can update their own invoice items" ON invoice_items FOR UPDATE USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = requesting_user_id())
);
CREATE POLICY "Users can delete their own invoice items" ON invoice_items FOR DELETE USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = requesting_user_id())
);

-- Grant permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoice_items TO authenticated;

-- Grant usage of sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;