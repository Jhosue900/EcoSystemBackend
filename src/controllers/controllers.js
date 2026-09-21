const supabase = require('../database/db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const DONATION_BUCKET = 'donation-images';

const register = async (req, res) => {
    try {
        const { name, lastname, age, country, city, mail, pass, user_type } = req.body;

        const { data: numUsersData, error: errorUsersData } = await supabase.from('users').select('*').eq('mail', mail);

        if(errorUsersData){
            // Antes decía `error.message`, pero `error` aún no existe en este punto (ReferenceError)
            return res.status(400).json({ message: errorUsersData.message})
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
    // Rutas de las imágenes ya subidas, para borrarlas si algo falla después
    const uploadedPaths = [];

    try {
        // Los campos de texto llegan en req.body (multipart) y las fotos en req.files (multer)
        const { category, title, location, availability, time_limit } = req.body;
        const files = req.files || [];

        const missing = Object.entries({ category, title, location, availability, time_limit })
            .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
            .map(([key]) => key);

        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
        }

        // 1. Subir imágenes a Supabase Storage y guardar sus URLs públicas
        const imageUrls = [];

        for (const file of files) {
            const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
            const path = `${req.user.id}/${randomUUID()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from(DONATION_BUCKET)
                .upload(path, file.buffer, { contentType: file.mimetype });

            if (uploadError) {
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }

            uploadedPaths.push(path);
            const { data: urlData } = supabase.storage.from(DONATION_BUCKET).getPublicUrl(path);
            imageUrls.push(urlData.publicUrl);
        }

        // 2. Guardar la donación
        const { data, error } = await supabase
            .from('donations')
            .insert([{
                images: imageUrls,
                category: category.trim(),
                title: title.trim(),
                location: location.trim(),
                availability: availability.trim(),
                time_limit: time_limit.trim(),
                user_id: req.user.id, // quién donó (viene del JWT)
            }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return res.status(201).json({ message: 'Donation created successfully', data });

    } catch (error) {
        console.error(error);

        if (uploadedPaths.length > 0) {
            await supabase.storage.from(DONATION_BUCKET).remove(uploadedPaths);
        }

        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};


const getMyDonations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('id, images, category, title, location, availability, time_limit, created_at')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ donations: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {
    register,
    login,
    createDonation,
    getMyDonations
};