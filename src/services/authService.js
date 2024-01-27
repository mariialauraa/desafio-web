import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:3000/'
});

const AuthService = {
    async login(user) {
        try {
            const res = await api.post('/admin/v1/login', { user })
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.user))
            return res.data            
        } catch (error) {
            console.log(error)
            throw new Error('Usuário ou senha inválidos')
        }
    },

    logout() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    },

    isAuthenticated() {
        return localStorage.getItem('token') !== null;
    },
};

export default AuthService;