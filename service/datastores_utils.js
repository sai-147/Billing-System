async function listTables(db) {
    try {
        const [rows] = await db.query(
            'show tables;'
        );
        [rows[4], rows[5]] = [rows[5], rows[4]];
        // console.log(rows);
        
        return rows;
        
    } catch (err) {
        console.error(err);
        return err;
    }
    
}

async function readTable(db, tb_name){
    try {
        const [rows] = await db.query(`select * from \`${tb_name}\``);
        return rows;
    }
    catch (err) {
        return err;
    }
}

async function readDesc(db, tb_name){
    try {
        const [rows] = await db.query(`desc \`${tb_name}\``);
        return rows;
    }
    catch (err) {
        return err;
    }
}





module.exports = {
    listTables,
    readTable,
    readDesc
};