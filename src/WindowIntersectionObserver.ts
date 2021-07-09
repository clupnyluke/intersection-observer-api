/* eslint-disable operator-linebreak */
import { curry } from 'lodash';
import * as IntersectionObserver from './IntersectionObserverApi';

// State
let disconnect: null | (() => void) = null;
let windowObserverList: IntersectionObserver.ObserverTargetList = [];

/**
 * will disconnect the currentwindowObserver and rebuild it using an updated Observer list
 */
const rebuildObserver = () => {
  if (disconnect !== null) {
    disconnect();
  }
  disconnect = IntersectionObserver.makeObserverFromList(windowObserverList);
};

/**
 * Will remove the observer target from the window observer list and disconnect the observer if
 * the list is empty or will rebuild the observer using the new list
 *
 * @param {ntersectionObserver.ObserverTarget} observerTarget
 */
const unobserve: (observerTarget: IntersectionObserver.ObserverTarget) => void =
(observerTarget: IntersectionObserver.ObserverTarget) => {
  windowObserverList = windowObserverList.filter((v) => observerTarget.target !== v.target);
  if (windowObserverList.length === 0) {
    disconnect!();
    disconnect = null;
  } else {
    rebuildObserver();
  }
};

/**
 * makes a new observer targets according to the params, check the thresholds, add the target
 * to the window observer list and return a function to stop observing the target unless
 *
 * no valid thresholds were found which it returns undefined
 * @param {Element} target
 * @param {number | number[]} thresholds
 * @param {IntersectionObserver.ObserverTargetCallback} callback
 * @returns undefined | () => unobserve(newObserverTarget)
 */
const observe:
(
  target: Element,
  thresholds: number | number[],
  callback: IntersectionObserver.ObserverTargetCallback
) => undefined | (() => void) =
(
  target: Element,
  thresholds: number | number[],
  callback: IntersectionObserver.ObserverTargetCallback,
) => {
  const thresholdList = (Array.isArray(thresholds) ? thresholds : [thresholds]);
  const Uniquethresholds = [...new Set(thresholdList)];
  const finalThresholds = Uniquethresholds.filter((v) => v >= 0 && v <= 1);
  if (finalThresholds.length !== Uniquethresholds.length) {
    console.warn('Thresholds for observation must be 0-1, Other entries ignored');
  }
  if (finalThresholds.length === 0) {
    console.error('No valid thresholds for observer');
    return undefined;
  }
  const newObserverTarget = {
    target,
    thresholds: [...finalThresholds],
    callback,
  };
  const addToList = curry(IntersectionObserver.addObserverTargetToList)(windowObserverList);
  windowObserverList = addToList(newObserverTarget);
  rebuildObserver();
  return () => unobserve(newObserverTarget);
};

export default observe;
