#!/usr/bin/env python3
"""
Script para verificar o estado atual das tabelas de Accounts Payable
"""
import psycopg2

def check_ap_tables():
    # Conectar ao banco
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        database='erp_db',
        user='postgres',
        password='210605'
    )
    cursor = conn.cursor()

    print('=' * 60)
    print('VERIFICANDO ESTADO DAS TABELAS DE ACCOUNTS PAYABLE')
    print('=' * 60)

    # Verificar tabelas existentes
    print('\n📊 TABELAS EXISTENTES:')
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('suppliers', 'accounts_payable_invoices', 'invoice_installments', 'payment_history', 'supplier_contacts')
        ORDER BY table_name
    """)
    tables = cursor.fetchall()

    expected_tables = ['suppliers', 'accounts_payable_invoices', 'invoice_installments', 'payment_history', 'supplier_contacts']
    existing_tables = [t[0] for t in tables]

    for table in expected_tables:
        if table in existing_tables:
            print(f'   ✅ {table}')
        else:
            print(f'   ❌ {table} (NÃO EXISTE)')

    # Verificar índices existentes
    print('\n📑 ÍNDICES EXISTENTES:')
    cursor.execute("""
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND (
            indexname LIKE 'idx_suppliers%' OR
            indexname LIKE 'idx_ap_%' OR
            indexname LIKE 'idx_installments%' OR
            indexname LIKE 'idx_payment%' OR
            indexname LIKE 'idx_supplier_contacts%'
        )
        ORDER BY indexname
    """)
    indexes = cursor.fetchall()
    for idx in indexes:
        print(f'   ✅ {idx[0]}')

    # Verificar triggers
    print('\n⚡ TRIGGERS EXISTENTES:')
    cursor.execute("""
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND event_object_table IN ('suppliers', 'accounts_payable_invoices', 'invoice_installments', 'supplier_contacts')
        ORDER BY event_object_table, trigger_name
    """)
    triggers = cursor.fetchall()
    if triggers:
        for trigger in triggers:
            print(f'   ✅ {trigger[0]} ON {trigger[1]}')
    else:
        print('   ❌ Nenhum trigger encontrado')

    # Verificar se função update_updated_at_column existe
    print('\n🔧 FUNÇÕES EXISTENTES:')
    cursor.execute("""
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = 'update_updated_at_column'
    """)
    func = cursor.fetchone()
    if func:
        print(f'   ✅ update_updated_at_column()')
    else:
        print(f'   ❌ update_updated_at_column() (NÃO EXISTE)')

    # Contar registros nas tabelas existentes
    print('\n📈 REGISTROS NAS TABELAS:')
    for table in existing_tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f'   {table}: {count} registro(s)')

    cursor.close()
    conn.close()

    print('\n' + '=' * 60)

if __name__ == '__main__':
    try:
        check_ap_tables()
    except Exception as e:
        print(f'\n❌ ERRO: {e}')
        import traceback
        traceback.print_exc()
