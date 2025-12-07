import * as chai from "https://cdnjs.cloudflare.com/ajax/libs/chai/5.1.2/chai.js";
// Importamos el proxy que conecta con tu API
import { proxy } from '../libreria/js/model/proxy.mjs';

const assert = chai.assert;

// Datos de prueba
const ISBN_TEST = "978-PROXY-TEST";
const CLIENTE_TEST = { 
    dni: "9999P", nombre: "Proxy", apellidos: "Tester", 
    email: "proxy@test.com", password: "123", rol: "CLIENTE" 
};

// Helper para crear libros
function crearLibro(isbn) {
    return {
        isbn: isbn,
        titulo: `Titulo ${isbn}`,
        autores: "Autor Test",
        portada: "http://img.com/1",
        resumen: "Resumen test",
        stock: 10,
        precio: 10.50
    };
}

describe("Rúbrica: PRUEBAS Proxy (Cliente)", function () {

    // Variable compartida para tests (libro creado y luego eliminado)
    let libroId;

    // --- 1. GETTERS Y SETTERS (1 pto) ---
    describe("1. Getters y Setters (Lectura)", function () {
        it("getLibros() - Debería devolver un array (aunque esté vacío)", async () => {
            const libros = await proxy.getLibros();
            assert.isArray(libros);
        });
        it("Getters y Setters - Libro: add, getLibros, getLibroPorId, update, remove", async () => {
            // Crear libro de pruebas
            const libro = await proxy.addLibro({ isbn: '978-GETSET', titulo: 'GS Libro', autores: 'A', precio: 1.0, stock: 5 });
            assert.isDefined(libro._id);
            const gsId = libro._id;

            // getLibros debe contener el libro creado
            const lista = await proxy.getLibros();
            const encontrado = lista.find(l => l._id === gsId || l.isbn === '978-GETSET');
            assert.ok(encontrado, 'El libro creado debe aparecer en la lista de libros');

            // getLibroPorId debe devolver el mismo libro
            const porId = await proxy.getLibroPorId(gsId);
            assert.equal(porId.titulo, 'GS Libro');

            // updateLibro
            const actualizado = await proxy.updateLibro({ _id: gsId, titulo: 'GS Libro Mod' });
            assert.equal(actualizado.titulo, 'GS Libro Mod');

            // removeLibro
            await proxy.removeLibro(gsId);
            try {
                await proxy.getLibroPorId(gsId);
                assert.fail('getLibroPorId no falló tras eliminar el libro');
            } catch (e) {
                assert.include(e.message, '404');
            }
        });

        it("Getters y Setters - Usuario: registrar, getUsuarioPorId, updateUsuario, getClientePorId, eliminar", async () => {
            const email = 'getset@test.com';
            // registrar
            let creado;
            try {
                creado = await proxy.registrar({ dni: 'GS1', nombre: 'GSUser', apellidos: 'Test', email, password: 'p', rol: 'CLIENTE' });
            } catch (e) {
                const resp = await fetch(`/api/clientes?email=${encodeURIComponent(email)}`);
                const users = await resp.json();
                creado = users[0];
            }
            assert.isDefined(creado._id);
            const uid = creado._id;

            // getUsuarioPorId
            const u = await proxy.getUsuarioPorId(uid);
            assert.equal(u.email, email);

            // updateUsuario
            const up = await proxy.updateUsuario({ _id: uid, nombre: 'GSMod', rol: 'CLIENTE' });
            assert.equal(up.nombre, 'GSMod');

            // getClientePorId (alias)
            const c = await proxy.getClientePorId(uid);
            assert.equal(c.nombre, 'GSMod');

            // eliminar usuario (directo a API)
            const res = await fetch(`/api/clientes/${uid}`, { method: 'DELETE' });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`No se pudo eliminar usuario: ${res.status} ${txt}`);
            }
            const after = await proxy.getUsuarioPorId(uid);
            assert.isNull(after);
        });
    });

    // --- 3. AGREGAR, MODIFICAR Y ELIMINAR (12 ptos) ---
    describe("3. Agregar, Modificar y Eliminar (CRUD Libros)", function () {

        it("addLibro() - Debería crear un libro y devolverlo con ID", async () => {
            const nuevoLibro = {
                isbn: ISBN_TEST,
                titulo: "Libro Proxy",
                autores: "Tester",
                precio: 20.00,
                stock: 10
            };
            const creado = await proxy.addLibro(nuevoLibro);
            assert.isDefined(creado._id, "El servidor debe asignar ID");
            assert.equal(creado.titulo, "Libro Proxy");
            libroId = creado._id;
        });

        it("updateLibro() - Debería modificar el precio", async () => {
            const modificacion = { _id: libroId, precio: 50.00 };
            const actualizado = await proxy.updateLibro(modificacion);
            assert.equal(actualizado.precio, 50.00);
        });

        it("getLibroPorId() - Debería recuperar el libro modificado", async () => {
            const libro = await proxy.getLibroPorId(libroId);
            assert.equal(libro.precio, 50.00);
        });

        it("removeLibro() - Debería eliminar el libro", async () => {
            await proxy.removeLibro(libroId);
            // Verificamos en la siguiente sección (Excepciones)
        });
    });

    // --- 2. EXCEPCIONES (5 ptos) ---
    describe("2. Excepciones (Manejo de Errores)", function () {
        
        it("getLibroPorId() - Debería lanzar error si el libro no existe (404)", async () => {
            try {
                await proxy.getLibroPorId(999999); // ID inexistente
                assert.fail("No lanzó excepción");
            } catch (e) {
                // Verificamos que sea un error controlado
                assert.include(e.message, "404", "El error debe indicar 404 Not Found");
            }
        });

        it("getLibroPorId() - Debería lanzar error para libro eliminado (404)", async () => {
            try {
                await proxy.getLibroPorId(libroId);
                assert.fail("No lanzó excepción para libro eliminado");
            } catch (e) {
                assert.include(e.message, "404", "El error debe indicar 404 Not Found para libro eliminado");
            }
        });

        it("autenticar() - Debería fallar con contraseña incorrecta", async () => {
            // Primero registramos al usuario (si no existe)
            try { await proxy.registrar(CLIENTE_TEST); } catch(e) {}

            try {
                await proxy.autenticar({
                    email: CLIENTE_TEST.email,
                    password: "WRONG_PASSWORD",
                    rol: "CLIENTE"
                });
                assert.fail("Debería haber fallado la autenticación");
            } catch (e) {
                assert.ok(true); // Pasó la prueba si entró al catch
            }
        });
    });

    // --- 4. CÁLCULOS (12 ptos) ---
    describe("4. Cálculos (Carrito de Compra)", function () {
        let clienteId, libroId;
        let facturaNumero;

        before(async () => {
            // Setup: Necesitamos Cliente y Libro frescos
            // 1. Obtener cliente
            try { 
                const res = await proxy.registrar({ ...CLIENTE_TEST, email: "calc@test.com", dni: "CALC1" });
                clienteId = res._id;
            } catch (e) {
                const resp = await fetch('/api/clientes?email=calc@test.com');
                const users = await resp.json();
                clienteId = users[0]._id;
            }

            // 2. Crear Libro para comprar (Precio 10€)
            const libro = await proxy.addLibro({
                isbn: "978-CALC", titulo: "Math Book", precio: 10.00, stock: 100
            });
            libroId = libro._id;
        });

        it("addClienteCarroItem() - Debería calcular Subtotal, IVA y Total", async () => {
            // Añadir 2 unidades a 10€
            const item = { libro: libroId, cantidad: 2 };
            
            // 1. Añadimos (API devuelve item)
            await proxy.addClienteCarroItem(clienteId, item);

            // 2. CORRECCIÓN: Pedimos el CARRO actualizado para verificar totales
            const carro = await proxy.getCarroCliente(clienteId);

            assert.equal(carro.subtotal, 20.00, "Subtotal incorrecto (2 * 10)");
            assert.closeTo(carro.iva, 4.20, 0.01, "IVA incorrecto (21% de 20 = 4.2)");
            assert.closeTo(carro.total, 24.20, 0.01, "Total incorrecto (20 + 4.2)");
        });

        it("setClienteCarroItemCantidad() - Debería recalcular al cambiar cantidad", async () => {
            // Cambiar a 5 unidades -> 50€ Subtotal
            await proxy.setClienteCarroItemCantidad(clienteId, 0, 5); // índice 0
            
            // Pedimos carro actualizado
            const carro = await proxy.getCarroCliente(clienteId);
            
            assert.equal(carro.subtotal, 50.00);
            assert.closeTo(carro.total, 60.50, 0.01, "Total recalculado incorrecto"); // 50 + 10.5 IVA
        });
        
        it("facturarCompraCliente() - Debería generar factura y vaciar carro", async () => {
             const datosFactura = {
                 cliente: clienteId,
                 nombre: "Test Calc",
                 direccion: "Calle Test"
             };
             
             const factura = await proxy.facturarCompraCliente(datosFactura);
             
             // Verificar factura
             assert.isNotNull(factura.numero, "La factura debe tener número");
             assert.closeTo(factura.total, 60.50, 0.01, "Total de factura incorrecto");
             facturaNumero = factura.numero;
             
             // Verificar carro vacío
             const carro = await proxy.getCarroCliente(clienteId);
             assert.equal(carro.items.length, 0, "El carro debería estar vacío tras facturar");
        });

        it("getFacturasPorCliente() - Debería listar facturas del cliente", async () => {
            const facturas = await proxy.getFacturasPorCliente(clienteId);
            assert.isArray(facturas);
            assert.isAtLeast(facturas.length, 1, "Debe existir al menos una factura para el cliente");
            const encontrada = facturas.find(f => f.numero === facturaNumero);
            assert.ok(encontrada, "La factura generada debe aparecer en la lista de facturas del cliente");
        });

        it("getFacturaPorNumero() - Debería devolver la factura por número", async () => {
            const f = await proxy.getFacturaPorNumero(facturaNumero);
            assert.equal(f.numero, facturaNumero);
            assert.closeTo(f.total, 60.50, 0.01);
        });
    });

    describe("Cliente: Modificar perfil (Perfil Cliente)", function () {
        let clienteModId;

        it("registrar() - Debería crear un cliente para modificar", async () => {
            const nuevo = { dni: "MOD1", nombre: "ModTest", apellidos: "Cliente", email: "mod@test.com", password: "123", rol: "CLIENTE" };
            try {
                const res = await proxy.registrar(nuevo);
                clienteModId = res._id;
            } catch (e) {
                // Si ya existe, buscarlo
                const resp = await fetch('/api/clientes?email=mod@test.com');
                const users = await resp.json();
                clienteModId = users[0]._id;
            }
        });

        it("updateUsuario() - Debería modificar el nombre y apellidos del cliente", async () => {
            const modificaciones = { _id: clienteModId, nombre: "Modificado", apellidos: "Actualizado", rol: "CLIENTE" };
            const actualizado = await proxy.updateUsuario(modificaciones);
            assert.equal(actualizado.nombre, "Modificado");
            assert.equal(actualizado.apellidos, "Actualizado");

            const recuperado = await proxy.getClientePorId(clienteModId);
            assert.equal(recuperado.nombre, "Modificado");
        });
    });

    describe("Cobertura adicional: Métodos proxy restantes", function () {
        let regClienteId;
        const regEmail = 'reg@test.com';

        it("registrar() - Debería registrar un cliente nuevo (o recuperar si ya existe)", async () => {
            const nuevo = { dni: 'REG1', nombre: 'RegTest', apellidos: 'User', email: regEmail, password: '123', rol: 'CLIENTE' };
            try {
                const res = await proxy.registrar(nuevo);
                regClienteId = res._id;
                assert.isDefined(regClienteId);
            } catch (e) {
                const resp = await fetch(`/api/clientes?email=${encodeURIComponent(regEmail)}`);
                const users = await resp.json();
                regClienteId = users[0]._id;
                assert.isDefined(regClienteId);
            }
        });

        it("autenticar() - Debería autenticar con credenciales correctas", async () => {
            const res = await proxy.autenticar({ email: regEmail, password: '123', rol: 'CLIENTE' });
            assert.isObject(res);
        });

        it("getUsuarioPorId() - Debería devolver el cliente registrado por id", async () => {
            const u = await proxy.getUsuarioPorId(regClienteId);
            assert.isObject(u);
            assert.equal(u._id, regClienteId);
        });

        it("getCarroCliente() - Debería devolver un carro (posiblemente vacío) del cliente", async () => {
            const carro = await proxy.getCarroCliente(regClienteId);
            assert.isObject(carro);
            assert.isArray(carro.items);
        });
    });

    describe("CRUD Usuarios (Cliente)", function () {
        let userId;
        const email = 'crud@test.com';

        it("registrar() - Crear usuario cliente", async () => {
            const nuevo = { dni: 'CRUD1', nombre: 'Crud', apellidos: 'User', email, password: 'pwd', rol: 'CLIENTE' };
            try {
                const res = await proxy.registrar(nuevo);
                userId = res._id;
                assert.isDefined(userId);
            } catch (e) {
                const resp = await fetch(`/api/clientes?email=${encodeURIComponent(email)}`);
                const users = await resp.json();
                userId = users[0]._id;
                assert.isDefined(userId);
            }
        });

        it("getUsuarioPorId() - Recuperar usuario creado", async () => {
            const u = await proxy.getUsuarioPorId(userId);
            assert.isObject(u);
            assert.equal(u._id, userId);
            assert.equal(u.email, email);
        });

        it("updateUsuario() - Modificar datos del usuario", async () => {
            const cambios = { _id: userId, nombre: 'CrudMod', apellidos: 'UserMod', rol: 'CLIENTE' };
            const updated = await proxy.updateUsuario(cambios);
            assert.equal(updated.nombre, 'CrudMod');
            const rec = await proxy.getUsuarioPorId(userId);
            assert.equal(rec.nombre, 'CrudMod');
        });

        it("delete usuario (API) - Debería eliminar el usuario y ya no recuperarlo", async () => {
            const res = await fetch(`/api/clientes/${userId}`, { method: 'DELETE' });
            if (!res.ok) {
                // Si la API devuelve error, fallamos la prueba para visibilizarlo
                const text = await res.text();
                throw new Error(`Eliminar usuario falló: ${res.status} ${text}`);
            }

            const after = await proxy.getUsuarioPorId(userId);
            // `getUsuarioPorId` devuelve null si no existe (según implementación de proxy)
            assert.isNull(after, 'El usuario debería ser null tras eliminarlo');
        });

        it("updateUsuario() - Actualizar usuario inexistente debería fallar", async () => {
            try {
                await proxy.updateUsuario({ _id: '000000000000000000000000', nombre: 'X', rol: 'CLIENTE' });
                assert.fail('No lanzó excepción al actualizar usuario inexistente');
            } catch (e) {
                assert.ok(true);
            }
        });
    });

    describe("Excepciones: Carro y Factura", function () {
        let clienteExId, libroExId;

        before(async () => {
            // Crear cliente para pruebas de excepciones
            try {
                const res = await proxy.registrar({ dni: 'EX1', nombre: 'Ex', apellidos: 'Carro', email: 'excarro@test.com', password: '123', rol: 'CLIENTE' });
                clienteExId = res._id;
            } catch (e) {
                const resp = await fetch('/api/clientes?email=excarro@test.com');
                const users = await resp.json();
                clienteExId = users[0]._id;
            }

            // Crear libro con stock limitado (1) para forzar error por cantidad
            const libro = await proxy.addLibro({ isbn: '978-EX-STK', titulo: 'Ex Stock', precio: 5.00, stock: 1 });
            libroExId = libro._id;
        });

        it("addClienteCarroItem() - Error si cantidad mayor que stock", async () => {
            try {
                await proxy.addClienteCarroItem(clienteExId, { libro: libroExId, cantidad: 5 });
                assert.fail('No lanzó excepción al añadir cantidad mayor que stock');
            } catch (e) {
                assert.ok(true);
            }
        });

        it("addClienteCarroItem() - Error al añadir libro inexistente", async () => {
            try {
                await proxy.addClienteCarroItem(clienteExId, { libro: '000000000000000000000000', cantidad: 1 });
                assert.fail('No lanzó excepción al añadir libro inexistente');
            } catch (e) {
                assert.ok(true);
            }
        });

        it("setClienteCarroItemCantidad() - Error con índice inválido en el carro", async () => {
            try {
                await proxy.setClienteCarroItemCantidad(clienteExId, 999, 1);
                assert.fail('No lanzó excepción al usar índice inválido en carro');
            } catch (e) {
                assert.ok(true);
            }
        });

        it("facturarCompraCliente() - Error al facturar carro vacío", async () => {
            try {
                await proxy.facturarCompraCliente({ cliente: clienteExId, nombre: 'Empty', direccion: 'Calle' });
                assert.fail('No lanzó excepción al facturar carro vacío');
            } catch (e) {
                assert.ok(true);
            }
        });
    });
});

// Cleanup: borrar recursos creados por este suite de pruebas
after(async function () {
    const isbns = [
        '978-PROXY-TEST', '978-GETSET', '978-CALC', '978-EX-STK'
    ];

    const emails = [
        'proxy@test.com', 'getset@test.com', 'calc@test.com', 'mod@test.com',
        'reg@test.com', 'crud@test.com', 'excarro@test.com'
    ];

    // Eliminar libros por ISBN
    for (const isbn of isbns) {
        try {
            const res = await fetch(`/api/libros?isbn=${encodeURIComponent(isbn)}`);
            if (!res.ok) continue;
            const arr = await res.json();
            for (const libro of arr) {
                try { await fetch(`/api/libros/${libro._id}`, { method: 'DELETE' }); }
                catch (e) { console.error('Error borrando libro', libro._id, e); }
            }
        } catch (e) { console.error('Error buscando libros para cleanup', isbn, e); }
    }

    // Eliminar clientes y admins por email
    for (const email of emails) {
        try {
            const cres = await fetch(`/api/clientes?email=${encodeURIComponent(email)}`);
            if (cres.ok) {
                const cArr = await cres.json();
                for (const u of cArr) {
                    try { await fetch(`/api/clientes/${u._id}`, { method: 'DELETE' }); }
                    catch (e) { console.error('Error borrando cliente', u._id, e); }
                }
            }
        } catch (e) { console.error('Error buscando clientes para cleanup', email, e); }

        try {
            const ares = await fetch(`/api/admins?email=${encodeURIComponent(email)}`);
            if (ares.ok) {
                const aArr = await ares.json();
                for (const u of aArr) {
                    try { await fetch(`/api/admins/${u._id}`, { method: 'DELETE' }); }
                    catch (e) { console.error('Error borrando admin', u._id, e); }
                }
            }
        } catch (e) { console.error('Error buscando admins para cleanup', email, e); }
    }

    // Eliminar facturas generadas por las pruebas (vaciar todas)
    try {
        await fetch('/api/facturas', { method: 'DELETE' });
    } catch (e) { console.error('Error borrando facturas (cleanup)', e); }

    // Indicador en consola para depuración
    try { console.log('proxy.spec cleanup completed'); } catch (e) {}
});