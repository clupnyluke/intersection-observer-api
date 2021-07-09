/* eslint-disable operator-linebreak */
import { curry } from 'lodash';

export interface ObserverState {
  movingUp: boolean
  movingDown: boolean
  movingRight: boolean
  movingLeft: boolean
  ratioGrowing: boolean
  ratioShrinking: boolean
}

export type ObserverTargetCallback = (
  entry: IntersectionObserverEntry,
  observerState: ObserverState
) => void;

export interface ObserverTarget {
  target: Element,
  thresholds: number[]
  callback: ObserverTargetCallback
}

interface ObserverTargetState {
  target: Element,
  thresholds: number[]
  callback: ObserverTargetCallback
  previousIntersectionRatio: number
  previousY: number
  previousX: number
}

export type IntersectionObserverOptions = {
  root: Element | Document | null
  rootMargin: string
};

export type ObserverTargetList = ObserverTargetState[];

/**
 *
 * Adds a observer target to an observer target list and returns the new list unless the
 * the observer target element is already found then returns undefined
 *
 * @param {ObserverTargetList} observerList
 * @param {ObserverTarget} observerTarget
 * @returns ObserverTargetList | undefined
 */
export const addObserverTargetToList:
// eslint-disable-next-line max-len
(observerList: ObserverTargetList, observerTarget: ObserverTarget) => ObserverTargetList =
(observerList: ObserverTargetList, observerTarget: ObserverTarget) => {
  const newObserverTarget = {
    ...observerTarget,
    previousIntersectionRatio: 0,
    previousY: 0,
    previousX: 0,
  };
  const duplicateElement = observerList.find((i) => i.target === observerTarget.target);
  if (duplicateElement !== undefined) {
    console.error('Only one entry per element allowed in observer target list');
    return observerList;
  }
  return [...observerList, newObserverTarget];
};

/**
 * checks the state of the observer root I.E. the direction it is moving and the ratio change
 * and calls the observer target callback as well as updates the state of the observer target
 *
 * @param {IntersectionObserverEntry} entry
 * @param {ObserverTargetState} observerTarget
 */
const manageObserverEntry:
(entry: IntersectionObserverEntry, observerTarget: ObserverTargetState) => void =
(entry: IntersectionObserverEntry, observerTarget: ObserverTargetState) => {
  const observerState = {
    movingDown: entry.boundingClientRect.y < observerTarget.previousY,
    movingUp: entry.boundingClientRect.y > observerTarget.previousY,
    movingRight: entry.boundingClientRect.x < observerTarget.previousX,
    movingLeft: entry.boundingClientRect.x > observerTarget.previousX,
    ratioGrowing: entry.intersectionRatio > observerTarget.previousIntersectionRatio,
    ratioShrinking: entry.intersectionRatio < observerTarget.previousIntersectionRatio,
  };
  observerTarget.callback(entry, observerState);
  // eslint-disable-next-line no-param-reassign
  observerTarget.previousX = entry.boundingClientRect.x;
  // eslint-disable-next-line no-param-reassign
  observerTarget.previousY = entry.boundingClientRect.y;
  // eslint-disable-next-line no-param-reassign
  observerTarget.previousIntersectionRatio = entry.intersectionRatio;
};

/**
 * Returns observer target matching the target element of the entry target if it contains a
 * threshold matching the threshold change otherwise returns undefined
 *
 * @param {ObserverTargetList} targetList
 * @param {IntersectionObserverEntry} entry
 * @returns ObserverTargetState | undefined
 */
const findEntryTargetFromObserverList:
// eslint-disable-next-line max-len
(targetList: ObserverTargetList, entry: IntersectionObserverEntry) => ObserverTargetState | undefined =
  (targetList: ObserverTargetList, entry: IntersectionObserverEntry) => {
    const observerTarget = targetList.find((i) => i.target === entry.target);
    let thresholdMet;
    if (observerTarget !== undefined) {
      const min = Math.min(entry.intersectionRatio, observerTarget.previousIntersectionRatio);
      const max = (min === entry.intersectionRatio)
        ? observerTarget.previousIntersectionRatio
        : entry.intersectionRatio;
      thresholdMet = observerTarget.thresholds.find((i) => min <= i && i <= max);
    }
    if (thresholdMet === undefined) {
      return undefined;
    }
    return observerTarget;
  };

/**
 * loops through the list of intersection observer entries and manages the state of any
 * observer targets that apply to the entry and calls the callback for that observer target
 *
 * @param {ObserverTargetList} observerTargets
 * @param {IntersectionObserverEntry[]} entries
 */
const manageObserverEntriesInList:
(observerTargets: ObserverTargetList, entries: IntersectionObserverEntry[]) => void =
  (observerTargets: ObserverTargetList, entries: IntersectionObserverEntry[]) => {
    const find = curry(findEntryTargetFromObserverList)(observerTargets);
    entries.forEach((entry) => {
      const manage = curry(manageObserverEntry)(entry);
      const observerTarget = find(entry);
      if (observerTarget !== undefined) {
        manage(observerTarget);
      }
    });
  };

/**
 * Makes an observer that will watch and manage the observer target list
 * returns the disconnect function for the observer
 * @param {ObserverTargetList} observerTargets
 * @param {IntersectionObserverOptions} options
 * @returns () => observer.disconnect()
 */
export const makeObserverFromList:
(observerTargets: ObserverTargetList, options?: IntersectionObserverOptions) => () => void =
  (
    observerTargets: ObserverTargetList,
    options: IntersectionObserverOptions =
    {
      root: null,
      rootMargin: '0px',
    },
  ) => {
    let thresholdList: number[] = [];
    observerTargets.forEach((target) => {
      const finalThresholds = target.thresholds.filter((v) => (v >= 0 && v <= 1));
      if (finalThresholds.length !== target.thresholds.length) {
        console.warn('Thresholds for observation must be 0-1, Other entries ignored');
      }
      thresholdList = [...new Set([...thresholdList, ...finalThresholds])];
    });
    if (thresholdList.length === 0) {
      console.warn('No valid thresholds for observer');
    }
    const internalOptions = {
      ...options,
      threshold: thresholdList,
    };
    const manageEntries = curry(manageObserverEntriesInList)(observerTargets);
    const observer = new IntersectionObserver(manageEntries, internalOptions);
    observerTargets.forEach((observerTarget) => observer.observe(observerTarget.target));
    return () => observer.disconnect();
  };
