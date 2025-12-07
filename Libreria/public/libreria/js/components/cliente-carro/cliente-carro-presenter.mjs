import { Presenter } from "../../commons/presenter.mjs";
import { libreriaSession } from "../../commons/libreria-session.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";
import { router } from "../../commons/router.mjs";

export class ClienteCarroPresenter extends Presenter {
  constructor(model, view) {
    super(model, view);
    this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
  }

  get carroBody() { return document.querySelector('#carroBody'); }
  get ivaTotal() { return document.querySelector('#ivaTotal'); }
  get totalFinal() { return document.querySelector('#totalFinal'); }
  get comprarForm() { return document.querySelector('#comprarForm'); }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();

    try {
      const clienteId = libreriaSession.getUsuarioId(); // Es síncrono
      const carro = await this.model.getCarroCliente(clienteId);
      
      this.renderCarro(carro, clienteId);
  
      this.comprarForm.onsubmit = (e) => this.comprarClick(e, clienteId);
    } catch (e) {
      console.error(e);
      this.mensajesPresenter.error("Error al cargar el carrito.");
    }
  }

  renderCarro(carro, clienteId) {
    this.carroBody.innerHTML = '';
    
    // Validación de carro vacío
    if (!carro || !carro.items || carro.items.length === 0) {
        this.carroBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">El carrito está vacío</td></tr>';
        this.ivaTotal.textContent = "0.00";
        this.totalFinal.textContent = "0.00";
        return;
    }

    carro.items.forEach((item, index) => {
      const row = document.createElement('tr');
      const precioUnidad = Number(item.libro.precio) || 0;
      const totalItem = Number(item.total) || 0;

      row.innerHTML = `
        <td class="item-cantidad">
          <input 
            type="number" 
            min="0" 
            value="${item.cantidad}" 
            id="cantidad-${index}"
            style="width: 50px;">
        </td>
        <td class="item-titulo">${item.libro.titulo} [${item.libro.isbn}]</td>
        <td class="item-unidad">${precioUnidad.toFixed(2)}</td>
        <td class="item-total">${totalItem.toFixed(2)}</td>
      `;

      this.carroBody.appendChild(row);

      const cantidadInput = document.querySelector(`#cantidad-${index}`);
      cantidadInput.addEventListener("change", async () => {
        const nuevaCantidad = parseInt(cantidadInput.value);
        try {
          await this.model.setClienteCarroItemCantidad(clienteId, index, nuevaCantidad);
          this.mensajesPresenter.mensaje("Carro actualizado");
          await this.refresh(); // Recargamos para ver nuevos totales
        } catch (e) {
          this.mensajesPresenter.error(e.message || "Error al actualizar cantidad");
        }
      });
    });

    // CORRECCIÓN: Totales fuera del bucle
    this.ivaTotal.textContent = Number(carro.iva).toFixed(2);
    this.totalFinal.textContent = Number(carro.total).toFixed(2);
  }

  async comprarClick(event, clienteId) {
    event.preventDefault();
  
    try {
      const carro = await this.model.getCarroCliente(clienteId);
      if (carro && carro.items && carro.items.length > 0) {
        sessionStorage.setItem("carroBackup", JSON.stringify(carro));
        router.navigate('/libreria/cliente-comprar-carro.html');
      } else {
        this.mensajesPresenter.error("El carrito está vacío, no puedes comprar.");
      }
    } catch (e) {
      this.mensajesPresenter.error(e.message || "Error al procesar la compra");
    }
  }
}