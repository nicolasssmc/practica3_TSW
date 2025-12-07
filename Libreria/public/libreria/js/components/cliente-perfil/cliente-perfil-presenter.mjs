import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";
import { libreriaSession } from "../../commons/libreria-session.mjs";

export class ClientePerfilPresenter extends Presenter {
  constructor(model, view) {
    super(model, view);
    this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
  }

  get dniInput() { return document.querySelector('#dniInput'); }
  get nombreInput() { return document.querySelector('#nombreInput'); }
  get apellidosInput() { return document.querySelector('#apellidosInput'); }
  get direccionInput() { return document.querySelector('#direccionArea'); }
  get emailInput() { return document.querySelector('#emailInput'); }
  get contrasenaInput() { return document.querySelector('#contrasenaInput'); }
  get guardarInput() { return document.querySelector('#guardarInput'); }

  set perfil(cliente) {
    this.dniInput.value = cliente.dni;
    this.nombreInput.value = cliente.nombre;
    this.apellidosInput.value = cliente.apellidos;
    this.direccionInput.value = cliente.direccion;
    this.emailInput.value = cliente.email;
    this.contrasenaInput.value = cliente.password;
  }

  async guardarClick(event) {
    event.preventDefault();

    try {
      const idUsuario = libreriaSession.getUsuarioId();
      
      // CORRECCIÓN: Obtener el usuario primero (esperando la promesa)
      const usuarioActual = await this.model.getUsuarioPorId(idUsuario);
      
      if (!usuarioActual) throw new Error("No se pudo recuperar la información del usuario");

      const perfilModificado = {
        _id: idUsuario,
        dni: this.dniInput.value.trim(),
        nombre: this.nombreInput.value.trim(),
        apellidos: this.apellidosInput.value.trim(),
        direccion: this.direccionInput.value.trim(),
        email: this.emailInput.value.trim(),
        password: this.contrasenaInput.value.trim(),
        rol: usuarioActual.rol // Ahora sí accedemos a la propiedad del objeto real
      };

      await this.model.updateUsuario(perfilModificado);
      this.mensajesPresenter.mensaje("Perfil modificado correctamente");
      
      router.navigate('/libreria/cliente-perfil.html'); 
    } catch (e) {
      console.error(e);
      this.mensajesPresenter.error(e.message || "No se ha podido actualizar el perfil.");
    }
  }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();

    try {
      const clienteId = libreriaSession.getUsuarioId();
      const cliente = await this.model.getUsuarioPorId(clienteId);

      if (cliente) {
        this.perfil = cliente;
        this.guardarInput.onclick = (event) => this.guardarClick(event);
      } else {
        this.mensajesPresenter.error("Cliente no encontrado");
      }
    } catch (error) {
      this.mensajesPresenter.error("Error de conexión al cargar perfil");
    }
  }
}