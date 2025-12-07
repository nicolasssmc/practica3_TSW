import { Presenter } from "../../commons/presenter.mjs";
import { libreriaSession } from "../../commons/libreria-session.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";
import { router } from "../../commons/router.mjs";

export class ClienteComprarCarroPresenter extends Presenter {
  constructor(model, view) {
    super(model, view);
    this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
  }

  get fechaInput() { return document.querySelector('#fechaInput'); }
  get razonInput() { return document.querySelector('#razonSocialInput'); }
  get direccionInput() { return document.querySelector('#direccionInput'); }
  get emailInput() { return document.querySelector('#emailInput'); }
  get dniInput() { return document.querySelector('#dniInput'); }
  get carroBody() { return document.querySelector('tbody'); }
  get ivaTotal() { return document.querySelector('#ivaTotal'); }
  get totalFinal() { return document.querySelector('#totalFinal'); }
  get comprarForm() { return document.querySelector('#comprarForm'); }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();

    const clienteId = libreriaSession.getUsuarioId();
    const cliente = await this.model.getClientePorId(clienteId);
    console.log('Cliente recibido en refresh:', cliente);

    this.emailInput.value = cliente.email;
    this.dniInput.value = cliente.dni;
    this.direccionInput.value = cliente.direccion;
    this.fechaInput.valueAsDate = new Date();

    const backup = sessionStorage.getItem("carroBackup");
    if (backup) {
      const data = JSON.parse(backup);
      cliente.carro.items = data.items;
      await this.model.getCarroCliente(clienteId);
      sessionStorage.removeItem("carroBackup");
    }
    
    const carro = await this.model.getCarroCliente(clienteId);

    console.log('Carro recibido en refresh:', carro);
    this.renderCarro(carro,clienteId);

    this.comprarForm.onsubmit = (e) => this.pagarClick(e, clienteId);
  }

  renderCarro(carro, clienteId) {
    console.log("Carro recibido en renderCarro:", carro);
    this.carroBody.innerHTML = '';
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
          id="cantidad-${index}">
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
          this.mensajesPresenter.mensaje("Carro modificado!");
          
          await this.refresh();
        } catch (e) {
          this.mensajesPresenter.error(e.message || "Error al actualizar cantidad");
        }
      });
      this.ivaTotal.textContent = Number(carro.iva).toFixed(2);
      this.totalFinal.textContent = Number(carro.total).toFixed(2);
    });


  }

  pagarClick = async (event, clienteId) => {
    event.preventDefault();
  
    try {
      const factura = {
        cliente: clienteId,
        fecha: this.fechaInput.value,
        razonSocial: this.razonInput.value,
        direccion: this.direccionInput.value,
        email: this.emailInput.value,
        dni: this.dniInput.value
      };
  
      const nueva = await this.model.facturarCompraCliente(factura);
  
      console.log("Factura generada:", nueva);
  
      const copiaFactura = {
        _id: nueva._id,
        numero: nueva.numero,
        fecha: nueva.fecha,
        razonSocial: nueva.razonSocial,
        direccion: nueva.direccion,
        email: nueva.email,
        dni: nueva.dni,
        iva: nueva.iva,
        total: nueva.total,
        cliente: nueva.cliente,
        items: nueva.items.map(item => ({
          cantidad: item.cantidad,
          total: item.total,
          libro: {
            titulo: item.libro.titulo,
            isbn: item.libro.isbn,
            precio: item.libro.precio
          }
        }))
      };
  
      sessionStorage.setItem(`factura_${nueva._id}`, JSON.stringify(copiaFactura));
  
      this.mensajesPresenter.mensaje("¡Compra realizada con éxito!");
      router.navigate('/libreria/cliente-home.html');
    } catch (e) {
      console.error(e);
      this.mensajesPresenter.error(e.message || "Error al generar la factura");
      router.navigate('/libreria/cliente-comprar-carro.html');
    }
  }
  
}