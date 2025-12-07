export const ROL = {
    ADMIN: "ADMIN",
    CLIENTE: "CLIENTE",
};

export class LibreriaProxy {
    constructor() { }

    // --- LIBROS ---
    async getLibros() {
        let response = await fetch('/api/libros');
        if (response.ok) return await response.json();
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    async getLibroPorId(id) {
        let response = await fetch(`/api/libros/${id}`);
        if (response.ok) return await response.json();
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    async addLibro(obj) {
        let response = await fetch('/api/libros', {
            method: 'POST',
            body: JSON.stringify(obj),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) return await response.json();
        throw new Error(`Error al añadir libro: ${response.statusText}`);
    }

    async removeLibro(id) {
        let response = await fetch(`/api/libros/${id}`, { method: 'DELETE' });
        if (response.ok) return await response.json();
        throw new Error(`Error al borrar libro: ${response.statusText}`);
    }

    async updateLibro(obj) {
        let response = await fetch(`/api/libros/${obj._id}`, {
            method: 'PUT',
            body: JSON.stringify(obj),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) return await response.json();
        throw new Error(`Error al actualizar libro: ${response.statusText}`);
    }

    // --- USUARIOS (Autenticación y Registro) ---
    async registrar(obj) {
        // Determinar endpoint según rol (aunque tu API unificada usa /api/usuarios o /api/clientes)
        let url = obj.rol === ROL.ADMIN ? '/api/admins' : '/api/clientes';
        let response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(obj),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) return await response.json();
        let err = await response.json();
        throw new Error(err.error || "Error en registro");
    }

    async autenticar(obj) {
        let url = obj.rol === ROL.ADMIN ? '/api/admins/autenticar' : '/api/clientes/autenticar';
        let response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(obj),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) return await response.json();
        let err = await response.json();
        throw new Error(err.message || "Error de autenticación");
    }

    async getUsuarioPorId(id, rol = null) {
        // Intenta buscar según el rol proporcionado o lo que esté en sesión
        if (!rol) {
            // Importar aquí para evitar circular dependencies
            const { libreriaSession } = await import('../commons/libreria-session.mjs');
            rol = libreriaSession.getUsuarioRol();
        }
        
        let url = rol === ROL.ADMIN ? `/api/admins/${id}` : `/api/clientes/${id}`;
        let response = await fetch(url);
        if (response.ok) return await response.json();
        // Si falla, intenta con el otro rol
        let fallbackUrl = rol === ROL.ADMIN ? `/api/clientes/${id}` : `/api/admins/${id}`;
        let fallbackResponse = await fetch(fallbackUrl);
        if (fallbackResponse.ok) return await fallbackResponse.json();
        return null; 
    }

    async getClientePorId(id) { return this.getUsuarioPorId(id); }
    
    async updateUsuario(obj) {
        // Asumimos cliente por defecto para perfil
        let url = obj.rol === ROL.ADMIN ? `/api/admins/${obj._id}` : `/api/clientes/${obj._id}`;
        let response = await fetch(url, {
            method: 'PUT',
            body: JSON.stringify(obj),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) return await response.json();
        throw new Error("Error actualizando perfil");
    }

    // --- CARRO DE COMPRA ---
    async getCarroCliente(id) {
         let response = await fetch(`/api/clientes/${id}/carro`);
         if (response.ok) return await response.json();
         throw new Error("Error recuperando carro");
    }

    async addClienteCarroItem(idCliente, item) {
        let response = await fetch(`/api/clientes/${idCliente}/carro/items`, {
            method: 'POST',
            body: JSON.stringify(item),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) return await response.json();
        throw new Error("Error añadiendo al carro");
    }

    async setClienteCarroItemCantidad(idCliente, index, cantidad) {
        let response = await fetch(`/api/clientes/${idCliente}/carro/items/${index}`, {
            method: 'PUT',
            body: JSON.stringify({ cantidad }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) return await response.json();
        throw new Error("Error actualizando carro");
    }

    // --- FACTURAS ---
    async facturarCompraCliente(factura) {
         let response = await fetch('/api/facturas', {
            method: 'POST',
            body: JSON.stringify(factura),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) return await response.json();
        let err = await response.json();
        throw new Error(err.error || "Error al facturar");
    }

    async getFacturasPorCliente(idCliente) {
        let response = await fetch(`/api/facturas?cliente=${idCliente}`);
        if (response.ok) return await response.json();
        return [];
    }
    
    async getFacturaPorNumero(numero) {
        let response = await fetch(`/api/facturas?numero=${numero}`);
        if (response.ok) {
            let res = await response.json();
            return Array.isArray(res) ? res[0] : res;
        }
        return null;
    }
}

export const proxy = new LibreriaProxy();