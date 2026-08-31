const supabase = require('../database/db.js');
const bcrypt = require('bcrypt');

const register = async (req, res) => {
    try {
        const { name, lastname, age, country, city, mail, pass, user_type } = req.body;
        const SALT_ROUNDS = 10;

        const hashed_password = await bcrypt.hash(pass, SALT_ROUNDS);

        const { data, error } = await supabase
            .from('users')
            .insert([{ 
                name, 
                lastname, 
                age, 
                country, 
                city, 
                mail, 
                pass: hashed_password, 
                user_type 
            }])
            .select(); 

        if (error) {
            console.error(error);
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json({ message: 'User registered successfully', data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    register
};