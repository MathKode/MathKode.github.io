#pip install mysql-connector-python
import mysql.connector
import getpass

password_ask = getpass.getpass("BDB PASSWORD : ")
db = mysql.connector.connect(host="localhost",
                     port=3306,
                     user="root",        
                     passwd=password_ask, 
                     db="db_test1")


"""
-- @block
DROP TABLE lycee;
CREATE TABLE lycee (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lycee_name VARCHAR(255),
    lycee_type VARCHAR(255),
    addr VARCHAR(255),
    ville VARCHAR(255),
    lycee_research TEXT
);
"""
def replace_antiascii(txt):
    txt=str(txt)
    l=list("eae")
    t=0
    for i in list("éàè"):
        txt = l[t].join(txt.split(i))
        t+=1
    txt = (c for c in txt if 0<ord(c)<127)
    return ''.join(txt)

cur = db.cursor()

file = open("lycee.csv", "r", encoding="utf-8")
c = file.read().split("\n")
file.close()
for i in c:
    if i != '' and i!=None and i!=[] and i!=['']:
        lycee_info = i.split(';')
        name = replace_antiascii(lycee_info[0])
        sorte = replace_antiascii(lycee_info[1])
        addresse = replace_antiascii(lycee_info[4])
        ville = replace_antiascii(lycee_info[5])
        
        cur.executemany("""INSERT INTO lycee (lycee_name, lycee_type, addr, ville, lycee_research)
                        VALUES (%s, %s, %s, %s, %s)""",
                        [
                        ({name},{sorte},{addresse},{ville},f"{name} ({ville})")
                        ] )
#print(cur.fetchall())
cur.executemany("""INSERT INTO lycee (lycee_name, lycee_type, addr, ville, lycee_research)
                        VALUES (%s, %s, %s, %s, %s)""",
                        [
                        ("Poudlard","Prive","UK","Harry Potter",f"Poudlard (Harry Potter)")
                        ] )
db.commit()
print("END")