import { Presenter } from "../../commons/presenter.mjs";
import { libreriaSession } from "../../commons/libreria-session.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";
import { router } from "../../commons/router.mjs";

export class ClienteComprasPresenter extends Presenter {
  constructor(model, view) {
    super(model, view);
    this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
  }

  get facturasBody() {
    return document.querySelector("#facturasBody");
  }

  get totalGeneral() {
    return document.querySelector("#totalGeneral");
  }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();

    try {
      const clienteId = libreriaSession.getUsuarioId();
      const facturas = await this.model.getFacturasPorCliente(clienteId);
      
      this.renderTabla(facturas);
    } catch (error) {
      console.error(error);
      this.mensajesPresenter.error("Error al cargar el historial de compras.");
    }
  }

  renderTabla(facturas) {
    this.facturasBody.innerHTML = "";
    
    if (!facturas || facturas.length === 0) {
      this.mensajesPresenter.mensaje("No hay compras registradas.");
      this.totalGeneral.textContent = "0.00";
      return;
    }

    let total = 0;
    facturas.forEach(factura => {
      const row = document.createElement("tr");
      // CORRECCIÓN: Usamos un enlace <a> estándar para que el router lo pueda capturar
      row.innerHTML = `
        <td style="padding: 10px;">${factura.numero}</td>
        <td style="padding: 10px;">${new Date(factura.fecha).toLocaleDateString()}</td>
        <td style="padding: 10px;">${Number(factura.total).toFixed(2)} €</td>
        <td style="padding: 10px;">
          <a class="boton" href="cliente-ver-compra.html?numero=${factura.numero}">Ver</a>
        </td>
      `;

      this.facturasBody.appendChild(row);
      total += Number(factura.total);
    });

    this.totalGeneral.textContent = total.toFixed(2);

    // IMPORTANTE: Llamamos a attachAnchors() para que los nuevos enlaces <a> 
    // funcionen con el Router sin recargar la página.
    this.attachAnchors(); 
  }
}