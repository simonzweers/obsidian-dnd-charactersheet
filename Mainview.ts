import { ItemView, WorkspaceLeaf } from 'obsidian';

// Import the Charactersheet Svelte component and the `mount` and `unmount` methods.

import Charactersheet from './Charactersheet.svelte';
import {mount, unmount} from 'svelte'

export const VIEW_TYPE_EXAMPLE = 'example-view';

export class CharacterSheetView extends ItemView {
  // A variable to hold on to the Counter instance mounted in this ItemView.
  counter: ReturnType<typeof Charactersheet> | undefined;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'Example SASDKL:JHA';
  }

  async onOpen() {
    // Attach the Svelte component to the ItemViews content element and provide the needed props.
    this.counter = mount(Charactersheet, {
      target: this.contentEl,
      props: {
        startCount: 5,
      }
    });

    // Since the component instance is typed, the exported `increment` method is known to TypeScript.
    this.counter.increment();
  }

  async onClose() {
    if (this.counter) {
      // Remove the Counter from the ItemView.
      unmount(this.counter);
    }
  }
}
