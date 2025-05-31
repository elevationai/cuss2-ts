import { Component } from "./Component.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { EnvironmentComponent } from "cuss2-typescript-models";
import type { Printer } from "./Printer.ts";

export class Feeder extends Component {
  printer?: Printer;
  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.FEEDER);
  }
}
