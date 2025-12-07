import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { libreriaSession } from "../../commons/libreria-session.mjs";
import { ROL } from "../../model/proxy.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";

export class InvitadoIngresoPresenter extends Presenter {
  constructor(model, view) {
    super(model, view);
    this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
  }

  get ingresoButton() { return document.querySelector('#ingresarInput'); }
  get emailInput() { return document.querySelector('#emailInput'); }
  get emailText() { return this.emailInput.value; }
  get passwordInput() { return document.querySelector('#passwordInput'); }
  get passwordText() { return this.passwordInput.value; }
  get rolSelect() { return document.querySelector('#rolSelect'); }
  get rolText() { return this.rolSelect.value; }

  get usuarioObject() {
    return { email: this.emailText, password: this.passwordText, rol: this.rolText }
  }

  async ingresoClick(event) {
    event.preventDefault();
    try {
      let usuario = await this.model.autenticar(this.usuarioObject);
      libreriaSession.ingreso(usuario);
      this.mensajesPresenter.mensaje(`Bienvenido ${usuario.nombre} ${usuario.apellidos}!`);
      console.log(libreriaSession, libreriaSession.esAdmin(), libreriaSession.esCliente())
      if (libreriaSession.esCliente())
        await router.navigate('/libreria/cliente-home.html');
      else if (libreriaSession.esAdmin())
        await router.navigate('/libreria/admin-home.html');
      else throw new Error('Rol no identificado');      
    } catch (e) {
      console.error(e);
      this.mensajesPresenter.error(e.message);
      await this.mensajesPresenter.refresh();
    }
  }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();
    this.ingresoButton.onclick = event => this.ingresoClick(event);
  }

}