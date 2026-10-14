/**
 * Role: public API of @skyline/sim-transport. Transport simulation rules; routing on the road graph (A*, cars and pedestrians) and deterministic line vehicles (timetable, position = f(line, service, game time)).
 * Owner: backend
 */

export { RoadGraph, type Arc, type GraphEdge, type GraphNode, type Point, type TravelMode } from './road-graph.ts';
export { findRoute, type Route, type RouteQuery } from './route-search.ts';
export type { Components } from './graph-components.ts';
export { measurePolyline, pointAlong, projectForward, type MeasuredPolyline, type PointAlong } from './polyline-measure.ts';
export {
  buildLineSchedule,
  departuresBetween,
  type Departure,
  type LineInput,
  type LineSchedule,
  type ServicePeriod,
  type ServiceProfile,
} from './line-schedule.ts';
export { dockedVehicleAt, nextArrivalAt, vehiclesAt, type LineVehicle } from './line-vehicles.ts';
