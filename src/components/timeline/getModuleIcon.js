import { CATEGORY_ICONS, MODULE_ICONS } from '../../content/modules';
import {
  SparkleIcon, CompassIcon, WavesIcon, BoatIcon, NotebookPenIcon,
  LeafIcon, MusicIcon, HeartHandshakeIcon, SnailIcon, ClockIcon, FireIcon,
} from '../shared/Icons';

const ICON_MAP = {
  sparkle: SparkleIcon,
  compass: CompassIcon,
  waves: WavesIcon,
  boat: BoatIcon,
  'notebook-pen': NotebookPenIcon,
  leaf: LeafIcon,
  music: MusicIcon,
  'heart-handshake': HeartHandshakeIcon,
  snail: SnailIcon,
  clock: ClockIcon,
  fire: FireIcon,
};

export function getModuleIcon(libraryId, category) {
  if (libraryId && MODULE_ICONS[libraryId]) return ICON_MAP[MODULE_ICONS[libraryId]] || SparkleIcon;
  if (category && CATEGORY_ICONS[category]) return ICON_MAP[CATEGORY_ICONS[category]] || SparkleIcon;
  return SparkleIcon;
}
