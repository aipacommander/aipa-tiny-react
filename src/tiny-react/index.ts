/**
 * tiny-react の公開 API。
 * デモやテストからは、内部ファイルではなくここだけを import する。
 */
export { createElement, Fragment } from './create-element';
export type {
  ComponentFn,
  ComponentProps,
  ElementVNode,
  Instance,
  Key,
  Props,
  TextVNode,
  VNode,
} from './types';
