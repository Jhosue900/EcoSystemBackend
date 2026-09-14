const supabase = require('../database/db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
    try {
        const { name, lastname, age, country, city, mail, pass, user_type } = req.body;

        const { data: numUsersData, error: errorUsersData } = await supabase.from('users').select('*').eq('mail', mail);

        if(errorUsersData){
            return res.status(400).json({ message: error.message})
        }
        
        if(numUsersData.length >= 1){
            return res.status(401).json({ message: 'User already exists'})
        }


        const SALT_ROUNDS = 10;
        const hashed_password = await bcrypt.hash(pass, SALT_ROUNDS);

        const { data, error } = await supabase
            .from('users').insert([{
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


const login = async (req, res) => {
    try {
        const { email, pass } = req.body;

        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('mail', email) 
            .maybeSingle();

        if (error) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if(!userData){
            return res.status(401).json({ message: "User doesn't exist"})
        }

        const esContrasenaCorrecta = await bcrypt.compare(pass, userData.pass);

        if (!esContrasenaCorrecta) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const payload = { 
            id: userData.id, 
            mail: userData.mail,
            user_type: userData.user_type 
        };
        
        const CLAVE_SECRETA = process.env.JWT_SECRET || 'tu_palabra_secreta_super_segura';
        
        const accessToken = jwt.sign(payload, CLAVE_SECRETA, { expiresIn: '1h' });

        return res.status(200).json({
            message: "¡Login exitoso!",
            session: {
                access_token: accessToken,
                token_type: "bearer",
                expires_in: 3600, 
                user: {
                    id: userData.id,
                    email: userData.mail,
                    user_metadata: {
                        name: userData.name,
                        lastname: userData.lastname,
                        age: userData.age,
                        country: userData.country,
                        city: userData.city,
                        user_type: userData.user_type
                    }
                }
            },
            user: { 
                id: userData.id, 
                name: userData.name, 
                mail: userData.mail 
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const createDonation = async (req, res) => {
    try{

        const { images, category, title, location, availability, time_limit } = req.body;

        const { data, error } = await supabase
            .from('donations').insert([{
                images: images, 
                category: category, 
                title: title, 
                location: location, 
                availability: availability, 
                time_limit: time_limit,
                }])
            .select(); 

        if(error){
            console.error(error)
            return res.status(404).json("Internal server error")
        }

        return res.status(200).json("Donation created successfully")


    }catch(error){
        console.error(error)
        res.status(404).json({ error: error.message})
    }
}


module.exports = {
    register,
    login,
    createDonation
};