import { Component } from "./Component.ts";
import { Feeder } from "./Feeder.ts";
import { Dispenser } from "./Dispenser.ts";
import type { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import { helpers } from "../helper.ts";
import {
  ComponentState,
  CussDataTypes,
  type DataRecordList,
  type EnvironmentComponent,
  MessageCodes,
  type PlatformData,
  PlatformDirectives,
} from "cuss2-typescript-models";
import { PlatformResponseError } from "./platformResponseError.ts";

export class Printer extends Component {
  constructor(
    component: EnvironmentComponent,
    cuss2: Cuss2,
    _type: DeviceType,
  ) {
    super(component, cuss2, _type);

    const missingLink = (msg: string) => {
      throw new Error(msg);
    };
    const linked = component.linkedComponentIDs?.map((id) => cuss2.components?.[id as number] as Component) || [];

    this.feeder = linked.find((c) => c instanceof Feeder) ||
      missingLink("Feeder not found for Printer " + this.id);
    this.subcomponents.push(this.feeder);

    const d = linked.find((c) => c instanceof Dispenser) as Dispenser;
    this.dispenser = d ||
      missingLink("Dispenser not found for Printer " + this.id);
    this.subcomponents.push(this.dispenser);
  }

  feeder: Feeder;
  dispenser: Dispenser;

  get mediaPresent(): boolean {
    return this.dispenser.mediaPresent;
  }

  override updateState(msg: PlatformData): void {
    //CUTnHOLD can cause a TIMEOUT response if the tag is not taken in a certain amount of time.
    // Unfortunately, it briefly considers the Printer to be UNAVAILABLE.
    if (
      msg.meta.platformDirective === PlatformDirectives.PERIPHERALS_SEND &&
      msg.meta.messageCode === MessageCodes.TIMEOUT &&
      msg.meta.componentState === ComponentState.UNAVAILABLE
    ) {
      msg.meta.componentState = ComponentState.READY;
    }

    // if now ready, query linked components to get their latest status
    if (!this.ready && msg.meta.componentState === ComponentState.READY) {
      this.feeder.query().catch(console.error);
      this.dispenser.query().catch(console.error);
    }
    else if (msg.meta.messageCode === MessageCodes.MEDIA_PRESENT) {
      // Emit mediaPresent event on the dispenser
      this.dispenser.emit("mediaPresent", true);
      // query the dispenser- which will start a poller that will detect when the media has been taken
      this.dispenser.query().catch(console.error);
    }

    // Call parent updateState to update status and emit events
    super.updateState(msg);
  }

  async setupITPS(commands: string[]): Promise<PlatformData> {
    const dataRecords = commands.map((command: string) => ({
      data: command as string,
      dsTypes: [CussDataTypes.DS_TYPES_ITPS],
    }));
    return await this.api.setup(this.id, dataRecords);
  }

  async sendITPS(commands: string[]): Promise<PlatformData> {
    const dataRecords = commands.map((command: string) => ({
      data: command as string,
      dsTypes: [CussDataTypes.DS_TYPES_ITPS],
    }));
    return await this.api.send(this.id, dataRecords);
  }

  async sendITPSCommand(cmd: string): Promise<string> {
    const pd = await this.setupITPS([cmd]);
    const records = pd.payload as DataRecordList;
    if (!records || records.length === 0) {
      throw new PlatformResponseError(pd);
    }
    return records[0].data || "";
  }

  async getEnvironment(): Promise<Record<string, string>> {
    const es = await this.sendITPSCommand("ES");
    return helpers.deserializeDictionary(es);
  }

  protected async getPairedResponse(cmd: string, n: number = 2): Promise<string[]> {
    const response = await this.sendITPSCommand(cmd);
    return helpers.split_every(response.substr(response.indexOf("OK") + 2), n) || [];
  }

  logos = {
    clear: async (id = ""): Promise<boolean> => {
      const response = await this.sendITPSCommand("LC" + id);
      return !!response && response.indexOf("OK") > -1;
    },
    query: async (): Promise<string[]> => {
      return await this.getPairedResponse("LS");
    },
  };

  pectabs = {
    clear: async (id = ""): Promise<boolean> => {
      const response = await this.sendITPSCommand("PC" + id);
      return !!response && response.indexOf("OK") > -1;
    },
    query: async (): Promise<string[]> => {
      return await this.getPairedResponse("PS");
    },
  };
}
