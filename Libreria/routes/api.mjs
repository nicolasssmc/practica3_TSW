import express from 'express';
import { model, ROL } from '../model/model.mjs';

const router = express.Router();

/**
 * --- LIBROS ---
 */
router.get('/libros', async (req, res) => {
    try {
        // Filtro por ISBN
        if (req.query.isbn) {
            const libro = await model.getLibroPorIsbn(req.query.isbn);
            return res.json(libro ? [libro] : []);
        }
        // Filtro por Título
        if (req.query.titulo) {
            const libros = await model.getLibroPorTitulo(req.query.titulo);
            return res.json(libros);
        }
        // Todos los libros
        const libros = await model.getLibros();
        res.json(libros);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/libros', async (req, res) => {
    try {
        const nuevos = req.body;
        if (Array.isArray(nuevos)) {
             // Método correcto del modelo para reemplazo masivo
             const libros = await model.setLibros(nuevos);
             res.json(libros);
        } else {
            res.status(400).json({ error: "Se esperaba un array de libros" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/libros', async (req, res) => {
    try {
        await model.removeLibros();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/libros', async (req, res) => {
    try {
        const libro = await model.addLibro(req.body);
        res.status(201).json(libro);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/libros/:id', async (req, res) => {
    try {
        const libro = await model.getLibroPorId(req.params.id);
        if (libro) res.json(libro);
        else res.status(404).json({ error: 'Libro no encontrado' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/libros/:id', async (req, res) => {
    try {
        const libro = await model.updateLibro({ ...req.body, _id: req.params.id });
        if (libro) res.json(libro);
        else res.status(404).json({ error: 'Libro no encontrado' });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/libros/:id', async (req, res) => {
    try {
        const result = await model.removeLibro(req.params.id);
        if (result) res.json({ ok: true });
        else res.status(404).json({ error: "Libro no encontrado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


/**
 * --- CLIENTES ---
 */
router.get('/clientes', async (req, res) => {
    try {
        if (req.query.email) {
            const c = await model.getClientePorEmail(req.query.email);
            return res.json(c ? [c] : []);
        }
        if (req.query.dni) {
             // Asumimos que el modelo ya tiene este método implementado
             const c = await model.getClientePorDni(req.query.dni);
             return res.json(c ? [c] : []);
        }
        res.json(await model.getClientes());
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/clientes', async (req, res) => {
    try {
        const nuevos = req.body;
        if (Array.isArray(nuevos)) {
            // Usamos setClientes para reemplazo masivo (consistente con setLibros)
            const clientes = await model.setClientes(nuevos);
            res.json(clientes);
        } else {
            res.status(400).json({ error: "Se esperaba un array de clientes" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/clientes', async (req, res) => {
    try {
        await model.removeClientes();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clientes', async (req, res) => {
    try {
        // Forzamos el rol CLIENTE
        const cliente = await model.addCliente({ ...req.body, rol: ROL.CLIENTE });
        res.status(201).json(cliente);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/clientes/:id', async (req, res) => {
    try {
        // getUsuarioPorId es genérico, verificamos el rol aquí
        const c = await model.getUsuarioPorId(req.params.id);
        if (c && c.rol === ROL.CLIENTE) res.json(c);
        else res.status(404).json({ error: 'Cliente no encontrado' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/clientes/:id', async (req, res) => {
    try {
        // updateUsuario es genérico
        const u = await model.updateUsuario({ ...req.body, _id: req.params.id });
        if (u) res.json(u);
        else res.status(404).json({ error: 'Usuario no encontrado' });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/clientes/:id', async (req, res) => {
    try {
        // removeCliente debería encargarse de verificar que sea cliente o usar removeUsuario
        const result = await model.removeCliente(req.params.id);
        if(result) res.json({ ok: true });
        else res.status(404).json({ error: "Cliente no encontrado" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clientes/autenticar', async (req, res) => {
    try {
        const usuario = await model.autenticar({ ...req.body, rol: ROL.CLIENTE });
        res.json(usuario);
    } catch (err) { res.status(401).json({ error: err.message }); }
});

// -- Carrito --
router.get('/clientes/:id/carro', async (req, res) => {
    try { 
        const carro = await model.getCarroCliente(req.params.id);
        res.json(carro); 
    } catch (e) { res.status(404).json({ error: e.message }); }
});

router.post('/clientes/:id/carro/items', async (req, res) => {
    try {
        const item = await model.addClienteCarroItem(req.params.id, req.body);
        res.status(201).json(item);
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/clientes/:id/carro/items/:index', async (req, res) => {
    try {
        await model.setClienteCarroItemCantidad(req.params.id, parseInt(req.params.index), req.body.cantidad);
        res.json({ ok: true });
    } catch (e) { res.status(400).json({ error: e.message }); }
});


/**
 * --- ADMINISTRADORES ---
 */
router.get('/admins', async (req, res) => {
    try {
        if (req.query.email) {
            const a = await model.getAdministradorPorEmail(req.query.email);
            return res.json(a ? [a] : []);
        }
        if (req.query.dni) {
             // Asumimos existencia del método en el modelo
             const a = await model.getAdminPorDni(req.query.dni);
             return res.json(a ? [a] : []);
        }
        res.json(await model.getAdmins());
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/admins', async (req, res) => {
    try {
        const nuevos = req.body;
        if (Array.isArray(nuevos)) {
            // Usamos setAdmins para reemplazo masivo
            const admins = await model.setAdmins(nuevos);
            res.json(admins);
        } else {
            res.status(400).json({ error: "Se esperaba un array de administradores" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/admins', async (req, res) => {
    try {
        await model.removeAdmins();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/admins', async (req, res) => {
    try {
        const admin = await model.addAdmin({ ...req.body, rol: ROL.ADMIN });
        res.status(201).json(admin);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/admins/:id', async (req, res) => {
    try {
        const a = await model.getUsuarioPorId(req.params.id);
        if (a && a.rol === ROL.ADMIN) res.json(a);
        else res.status(404).json({ error: 'Admin no encontrado' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/admins/:id', async (req, res) => {
    try {
        const u = await model.updateUsuario({ ...req.body, _id: req.params.id });
        if(u) res.json(u);
        else res.status(404).json({ error: 'Usuario no encontrado' });
    } catch (e) { res.status(404).json({ error: e.message }); }
});

router.delete('/admins/:id', async (req, res) => {
    try {
        const result = await model.removeAdmin(req.params.id);
        if(result) res.json({ ok: true });
        else res.status(404).json({ error: "Admin no encontrado" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/admins/autenticar', async (req, res) => {
    try {
        const usuario = await model.autenticar({ ...req.body, rol: ROL.ADMIN });
        res.json(usuario);
    } catch (err) { res.status(401).json({ error: err.message }); }
});

/**
 * --- FACTURAS ---
 */
router.get('/facturas', async (req, res) => {
    try {
        if (req.query.cliente) {
             const facturas = await model.getFacturasPorCliente(req.query.cliente);
             return res.json(facturas);
        }
        if (req.query.numero) {
            const f = await model.getFacturaPorNumero(Number(req.query.numero));
            return res.json(f ? [f] : []);
        }
        
        const facturas = await model.getFacturas();
        res.json(facturas);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/facturas', async (req, res) => {
    try {
        const nuevos = req.body;
        if (Array.isArray(nuevos)) {
            // Usamos setFacturas para consistencia
            const facturas = await model.setFacturas(nuevos);
            res.json(facturas);
        } else {
            res.status(400).json({ error: "Se esperaba un array de facturas" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/facturas', async (req, res) => {
    try {
        await model.removeFacturas();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/facturas', async (req, res) => {
    try {
        const f = await model.facturarCompraCliente(req.body);
        res.status(201).json(f);
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/facturas/:id', async (req, res) => {
    try {
        const f = await model.getFacturaPorId(req.params.id);
        if (f) res.json(f);
        else res.status(404).json({ error: 'Factura no encontrada' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Ruta para resetear la BD
router.delete('/test-reset', async (req, res) => {
    try {
        await model.reset();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;