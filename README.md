# intersection-observer-api

A small helper library to help manage intersection obeservers specifically the window observer. 

## Installation
Using npm:
```shell
npm i intersection-observer-api
```

## Usage: 

If using the intersection observer with the window with no margin all that is needed is to import observe and call it. 
It takes an element as the first parameter, an array of numbers 0-1 as the second, and lastly a callback in the form of (Observer Entry, Observer State) => void.
Returns a function to unobserve the element

```
Observer Entry
  - target: Element
  - boundingClientRect: dom Rect
  - intersectionRatio : number
  - intersectionRect: dom rect
  - isIntersecting: boolean
  - rootBounds: dom rect
  - time: number

Observer State
  - movingUp: boolean
  - movingDown: boolean
  - movingRight: boolean
  - movingLeft: boolean
  - ratioGrowing: boolean
  - ratioShrinking: boolean
```

## Contact:
- clupnyluke@gmail.com

If you are feeling generous feel free to buy me a coffee at [Paypal](https://www.paypal.com/donate?hosted_button_id=WVWGAVAC7ZA6Q)


