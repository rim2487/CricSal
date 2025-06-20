import mysql.connector
from flask import Flask

app = Flask(__name__)

def get_db_connection():
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password='123456',
        database='cricSal'
    )
    return connection
