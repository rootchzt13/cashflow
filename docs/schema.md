### Supabase table Name & Column List ###

# TableName : 'Manager'
# ColumnList:
- id : int8
- created_at : timestampz
- user_id : text
- type : text
- jumlah : int8
- label : text
- catatan: text


# TableName : 'LabelList'
# ColumnList:
- id : int8
- created_at : timestampz
- user_id : text
- label_name: text


# TableName : 'Operasional'
# ColumnList:
- id : int8
- created_at : timestampz
- user_id : text
- label_name: text
- biaya_checkout : int8
- biaya_buat_toko : int8
- biaya_peking : int8
- biaya_username : int8
- biaya_ongkir : int8