import { defineTimezoneOverlapMap } from './element';

export { TAG_NAME, TimezoneOverlapMapElement, defineTimezoneOverlapMap, type ZoneChangeEvent } from './element';
export { offsetMinutes, overlap, type Overlap, type Segment } from './overlap';

// importing the package registers <timezone-overlap-map>
defineTimezoneOverlapMap();
