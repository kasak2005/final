from supabase import create_client, Client
from dotenv import load_dotenv
import os, traceback

# Load Supabase credentials
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_to_table(table_name: str, value: dict):
    """
    Save a dictionary to the specified table, only including keys that match the table's columns.
    Returns the response or error.
    """
    try:
        response= supabase.table(table_name).insert([value]).execute()
        if response.error:
            raise Exception(f"Error inserting to {table_name}: {response.error.message}")

    except Exception as e:
        print('Exception in save_to_table:', traceback.format_exc())
        return {"error": str(e)}