import { Printer } from "./Printer.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { EnvironmentComponent } from "cuss2-typescript-models";

export class BagTagPrinter extends Printer {
  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.BAG_TAG_PRINTER);
  }

  override pectabs: {
    clear: (id?: string) => Promise<boolean>;
    query: () => Promise<string[]>;
  } = {
    clear: async (id = ""): Promise<boolean> => {
      const response = await this.sendITPSCommand("PC" + id);
      return !!response && response.indexOf("OK") > -1;
    },
    query: async (): Promise<string[]> => {
      return await this.getPairedResponse("PS", 4);
    },
  };
}
