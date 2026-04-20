/**
 * Transition custom block registry.
 *
 * Passed as `customBlockRegistry` prop to `ScreensSection` by `TransitionModule`.
 * ScreensSection falls through to this map when a block type doesn't match
 * one of the standard MasterModule blocks.
 */

import ActionBlock from './ActionBlock';
import StoreDisplayBlock from './StoreDisplayBlock';
import ExpandableBlock from './ExpandableBlock';
import DataDownloadBlock from './DataDownloadBlock';
import TouchstoneArcBlock from './TouchstoneArcBlock';
import PhaseRecapBlock from './PhaseRecapBlock';
import IngestionTimeBlock from './IngestionTimeBlock';
import BodyCheckInBlock from './BodyCheckInBlock';
import EditableDoseBlock from './EditableDoseBlock';

const TRANSITION_CUSTOM_BLOCKS = {
  'action': ActionBlock,
  'store-display': StoreDisplayBlock,
  'expandable': ExpandableBlock,
  'data-download': DataDownloadBlock,
  'touchstone-arc': TouchstoneArcBlock,
  'phase-recap': PhaseRecapBlock,
  'ingestion-time': IngestionTimeBlock,
  'body-check-in': BodyCheckInBlock,
  'editable-dose': EditableDoseBlock,
};

export default TRANSITION_CUSTOM_BLOCKS;

export {
  ActionBlock,
  StoreDisplayBlock,
  ExpandableBlock,
  DataDownloadBlock,
  TouchstoneArcBlock,
  PhaseRecapBlock,
  IngestionTimeBlock,
  BodyCheckInBlock,
  EditableDoseBlock,
};
