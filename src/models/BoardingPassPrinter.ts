import { Printer } from "./Printer.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { EnvironmentComponent } from "cuss2-typescript-models";

export class BoardingPassPrinter extends Printer {
  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.BOARDING_PASS_PRINTER);
  }

  templates: {
    clear: (id?: string) => Promise<boolean>;
    query: (id?: string) => Promise<string[]>;
  } = {
    clear: async (id = ""): Promise<boolean> => {
      const response = await this.sendITPSCommand("TC" + id);
      return !!response && response.indexOf("OK") > -1;
    },
    query: async (): Promise<string[]> => {
      return await this.getPairedResponse("TA");
    },
  };
}
