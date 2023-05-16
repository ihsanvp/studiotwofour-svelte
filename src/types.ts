export type SvelteEvent<E, T> = E & {
    currentTarget: EventTarget & T
}