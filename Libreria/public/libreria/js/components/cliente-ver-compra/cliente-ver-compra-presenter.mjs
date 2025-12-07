import { Presenter } from "../../commons/presenter.mjs";
import { libreriaSession } from "../../commons/libreria-session.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";
import { router } from "../../commons/router.mjs";  

export class ClienteVerCompraPresenter extends Presenter {
  constructor(model, view) {
    super(model, view);
    this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
  }

  get tablaBody() {
    return document.querySelector("#detalleBody");
  }

  get ivaField() {
    return document.querySelector("#ivaTotal");
  }

  get totalField() {
    return document.querySelector("#totalFinal");
  }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();

    try {
      const params = new URLSearchParams(window.location.search);
      const facturaId = params.get("id");
      const numeroParam = params.get("numero");
      let factura = null;

      // 1. Intentar cargar desde el Servidor (Proxy)
      if (numeroParam) {
        // getFacturaPorNumero puede devolver null si no existe
        const arr = await this.model.getFacturaPorNumero(Number(numeroParam));
        factura = Array.isArray(arr) ? arr[0] : arr;
      } else if (facturaId) {
        // getFacturaPorId suele lanzar error si es 404, el catch lo capturará
        factura = await this.model.getFacturaPorId(facturaId);
      }

      // 2. Fallback (Copia local) si el servidor falló o no trajo nada
      if (!factura && facturaId) {
        const copia = sessionStorage.getItem(`factura_${facturaId}`);
        if (copia) {
          factura = JSON.parse(copia);
          this.mensajesPresenter.mensaje("Aviso: Mostrando copia local de la factura.");
        }
      }

      if (!factura) throw new Error('Factura no encontrada en el sistema');

      // 3. Renderizar datos
      document.getElementById("numero").textContent = factura.numero;
      document.getElementById("fecha").textContent = factura.fecha;
      document.getElementById("razonSocial").textContent = factura.razonSocial;
      document.getElementById("dni").textContent = factura.dni;
      document.getElementById("direccion").textContent = factura.direccion;
      document.getElementById("email").textContent = factura.email;

      this.tablaBody.innerHTML = "";
      factura.items.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="item-cantidad">${item.cantidad}</td>
          <td class="item-titulo">${item.libro.titulo} [${item.libro.isbn}]</td>
          <td class="item-unidad">${Number(item.libro.precio).toFixed(2)}</td>
          <td class="item-total">${Number(item.total).toFixed(2)}</td>
        `;
        this.tablaBody.appendChild(row);
      });

      this.ivaField.textContent = Number(factura.iva).toFixed(2);
      this.totalField.textContent = Number(factura.total).toFixed(2);

    } catch (e) {
      console.error(e);
      this.mensajesPresenter.error(e.message || "Error al cargar la factura");
    }
  }
}