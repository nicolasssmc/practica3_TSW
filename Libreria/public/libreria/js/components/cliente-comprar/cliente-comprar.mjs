import { Presenter } from "../../commons/presenter.mjs";
import { libreriaSession } from "../../commons/libreria-session.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";
import { router } from "../../commons/router.mjs";

export class ClienteComprarPresenter extends Presenter {
    constructor(model, view) {
        super(model, view);
        this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
    }

    async refresh() {
        await super.refresh();
        await this.mensajesPresenter.refresh();

        try {
            const clienteId = libreriaSession.getUsuarioId();
            
            // 1. Cargar Datos del Cliente (Async)
            await this.cargarDatosCliente(clienteId);
            
            // 2. Cargar Carrito del Servidor (Async)
            await this.cargarCarrito(clienteId);

            // 3. Configurar botón de pago
            const btnPagar = document.querySelector('#pagarButton');
            if (btnPagar) {
                btnPagar.onclick = (e) => this.pagarCompra(e, clienteId);
            }

        } catch (e) {
            console.error(e);
            this.mensajesPresenter.error("Error al cargar la página de compra.");
        }
    }

    async cargarDatosCliente(id) {
        // Usamos getUsuarioPorId que es el método que tiene el Proxy
        const cliente = await this.model.getUsuarioPorId(id);
        if (!cliente) return;

        // Rellenar formulario con datos actuales
        const setVal = (id, val) => { 
            const el = document.getElementById(id); 
            if(el) el.value = val || ''; 
        };

        setVal('razonSocialInput', cliente.nombre);
        setVal('dniInput', cliente.dni);
        setVal('direccionInput', cliente.direccion);
        setVal('emailInput', cliente.email);
        
        const fechaEl = document.getElementById('fechaInput');
        if(fechaEl) fechaEl.value = new Date().toISOString().split('T')[0];
    }

    async cargarCarrito(id) {
        const tbody = document.querySelector('#detalleCompra tbody');
        if(!tbody) return;
        tbody.innerHTML = ''; 

        const carro = await this.model.getCarroCliente(id);
        
        if (!carro || !carro.items || carro.items.length === 0) {
            this.mensajesPresenter.mensaje("El carrito está vacío.");
            return;
        }

        // Renderizar items
        carro.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.cantidad}</td>
                <td>${item.libro.titulo}</td>
                <td>${Number(item.libro.precio).toFixed(2)}</td>
                <td>${Number(item.total).toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });

        // Usar totales calculados por el servidor
        const ivaEl = document.getElementById("ivaTotal");
        const totalEl = document.getElementById("totalCompra");
        
        if(ivaEl) ivaEl.textContent = Number(carro.iva).toFixed(2);
        if(totalEl) totalEl.textContent = Number(carro.total).toFixed(2);
    }

    async pagarCompra(event, clienteId) {
        event.preventDefault();
        try {
            // Recopilar datos del formulario final
            const facturaData = {
                cliente: clienteId,
                fecha: document.getElementById('fechaInput').value,
                razonSocial: document.getElementById('razonSocialInput').value,
                dni: document.getElementById('dniInput').value,
                direccion: document.getElementById('direccionInput').value,
                email: document.getElementById('emailInput').value
            };

            // Llamada al servidor para procesar la compra
            await this.model.facturarCompraCliente(facturaData);

            // El servidor se encarga de vaciar el carro, nosotros solo notificamos y redirigimos
            this.mensajesPresenter.mensaje("Compra realizada con éxito.");
            
            // Redirigir a historial de compras
            router.navigate('/libreria/cliente-compras.html');

        } catch (error) {
            console.error(error);
            this.mensajesPresenter.error("No se pudo realizar la compra: " + (error.message || "Error desconocido"));
        }
    }
}