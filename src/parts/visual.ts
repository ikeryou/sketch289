import { Body } from "matter-js";
import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Object3D } from 'three/src/core/Object3D';
import { Update } from '../libs/update';
import { MatterjsMgr } from './matterjsMgr';
import { Mesh } from 'three/src/objects/Mesh';
import { Vector3 } from 'three/src/math/Vector3';
import { BoxGeometry } from 'three/src/geometries/BoxGeometry';
import { MeshLambertMaterial } from 'three/src/materials/MeshLambertMaterial';
import { Scroller } from "../core/scroller";
import { Tween } from "../core/tween";
import { Point } from "../libs/point";
import { Conf } from "../core/conf";
import { PointLight } from "three";
import { Util } from "../libs/util";

export class Visual extends Canvas {

  private _con:Object3D;
  private _matterjs:MatterjsMgr;

  private _item:Array<Object3D> = [];
  private _txt:Array<{el:HTMLElement, pos:Point}> = [];
  private _isBack:boolean;

  constructor(opt: any) {
    super(opt);

    this._matterjs = opt.matterjs;
    this._isBack = opt.isBack;

    this._con = new Object3D();
    this.mainScene.add(this._con);

    const light = new PointLight(0xffffff, 1);
    this.mainScene.add(light)
    light.position.x = Func.instance.sw() * 0;
    light.position.y = Func.instance.sh() * 0;
    light.position.z = Func.instance.sh() * 1 * (this._isBack ? 1 : 1);

    // 障害物
    const geo = new BoxGeometry(1,1,1);
    this._matterjs.lineBodies[0].forEach(() => {
      const c = new Object3D();
      this._con.add(c);

      const mesh = new Mesh(
        geo,
        new MeshLambertMaterial({
          color: 0xffffff,
          emissive:0x333333,
          transparent:true,
          depthTest:false,
        })
      )
      c.add(mesh);
      mesh.position.set(0, 0.5, 0.5);

      this._item.push(c);
    })



    // テキスト作る
    if(!this._isBack) {
      let y = Func.instance.sh() * 1.5;
      for(let i = 0; i < Conf.instance.TEXT_NUM; i++) {
        const t = document.createElement('div');
        t.innerHTML = 'SCROLL';
        t.classList.add('item');
        document.querySelector('.l-text')?.append(t);

        const x = Util.instance.random(0, Func.instance.sw())
        this._txt.push({
          el:t,
          pos:new Point(x, y) // Xは無視
        });
        y += Func.instance.sh() * 1.25;
      }

      Tween.instance.set(document.querySelector('.l-height'), {
        height:y + Func.instance.sh() * 0.5
      })
    }


    Scroller.instance.set(0);
    this._resize()
  }


  protected _update(): void {
    super._update()

    // this._con.position.y = Func.instance.screenOffsetY() * -1;

    const sw = Func.instance.sw()
    const sh = Func.instance.sh()

    const scroll = Scroller.instance.val.y;

    this._txt.forEach((val,i) => {
      const txtSize = this.getRect(val.el);
      let txtX = val.pos.x;
      let txtY = val.pos.y - scroll;

      const itemBody = this._matterjs.itemBodies[i];

      Tween.instance.set(val.el, {
        x:txtX - txtSize.width * 0.5,
        y:txtY - txtSize.height * 0.5,
        fontSize: itemBody.size,
      })

      if(itemBody != undefined) Body.setPosition(itemBody.body, {x:txtX, y:txtY})
    })

    const b = this._matterjs.lineBodies[0];
    const bridgeSize = (sw / b.length) * 0.5;
    b.forEach((val,i) => {
      let bodyX = val.position.x - sw * 0.5
      let bodyY = val.position.y * -1 + sh * 0.5

      const offsetX = this._isBack ? 0 : bridgeSize * 1;

      const mesh = this._item[i];
      const to = new Vector3((sw / b.length) * i - sw * 0.5 + bridgeSize + offsetX, 0, 0);

      const top = sw * 0.05;
      const from = new Vector3(bodyX + offsetX, bodyY, -top);

      if(this._isBack) {
        mesh.position.copy(to)
        mesh.lookAt(from)
      } else {
        mesh.position.copy(from)
        mesh.lookAt(to)
      }


      const size = bridgeSize * 1;
      mesh.scale.set(size, size, to.distanceTo(from) * 1);
    })

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    this.renderer.setClearColor(0x00000, 0)
    this.renderer.render(this.mainScene, this.camera)
  }


  public isNowRenderFrame(): boolean {
    return this.isRender && Update.instance.cnt % 1 == 0
  }


  _resize(isRender: boolean = true): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    this.renderSize.width = w;
    this.renderSize.height = h;

    this.updateCamera(this.camera, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();

    if (isRender) {
      this._render();
    }
  }
}
