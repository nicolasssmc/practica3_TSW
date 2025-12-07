import { Presenter } from "../../commons/presenter.mjs";
import { libreriaSession } from "../../commons/libreria-session.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs"; // Usamos el presenter estándar

export class ClienteListaComprasPresenter extends Presenter {
    constructor(model, view) {
        super(model, view);
        // Instanciamos el gestor de mensajes correctamente
        this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
    }

    get listaComprasTable() {
        return document.querySelector('#listaCompras tbody');
    }

    // refresh debe ser async para esperar al servidor
    async refresh() {
        await super.refresh(); // Carga el HTML
        await this.mensajesPresenter.refresh(); // Limpia mensajes
        await this.cargarCompras(); // Carga datos
    }

    async cargarCompras() {
        try {
            const clienteId = libreriaSession.getUsuarioId();
            
            // CORRECCIÓN: Pedimos las facturas al Servidor (Proxy)
            const compras = await this.model.getFacturasPorCliente(clienteId);
            
            this.listaComprasTable.innerHTML = ""; // Limpiar tabla antes de pintar

            if (!compras || compras.length === 0) {
                this.mensajesPresenter.mensaje("No hay compras registradas.");
            } else {
                compras.forEach(compra => {
                    const row = document.createElement('tr');
                    // Aseguramos formato de número
                    const total = Number(compra.total).toFixed(2);
                    
                    row.innerHTML = `
                        <td>${compra.fecha}</td>
                        <td>${compra.numero}</td>
                        <td>${compra.razonSocial}</td>
                        <td>${total} €</td>
                        <td><a href="cliente-ver-compra.html?id=${compra._id}">Ver</a></td>
                    `;
                    this.listaComprasTable.appendChild(row);
                });
            }
        } catch (e) {
            console.error(e);
            this.mensajesPresenter.error("Error al cargar el historial de compras.");
        }
    }
}