/**
 * UserInputComponent - Interactive components for user input
 * Can be enabled/disabled, but cannot send data
 */

import { InteractiveComponent } from "./InteractiveComponent.ts";

export abstract class UserInputComponent extends InteractiveComponent {
  // User input components can be enabled/disabled but cannot send
  // They receive input from users
}
