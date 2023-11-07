import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { boundedValue, cn } from "../utils/utils";

type Offset = { offsetTop: number, offsetLeft: number }
type CurrentObject = { id: string, offset: Offset }

interface DragWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  bounded?: boolean;
  children: React.ReactNode
}

export interface DragProviderProps {
  handleItemPress: (id: string, offset: Offset) => void,
  containerBounds: DOMRect | null
}

export const DragProvider = createContext({} as DragProviderProps)

const DragWrapper = ({ children, className, bounded, ...rest }: DragWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerBounds = containerRef.current ? containerRef.current.getBoundingClientRect() : null

  const [currentObject, setCurrentObject] = useState<CurrentObject | null>(null)

  const movingObject = useMemo(() => {
    if (!currentObject) return null

    const element = containerRef.current!.querySelector<HTMLDivElement>(`div[data-id='${currentObject.id}']`)!
    let zIndex = Number(element.style.zIndex ?? "0")

    const rest = containerRef.current!.querySelectorAll<HTMLDivElement>(`div:not([data-id='${currentObject.id}'])`)
    rest.forEach((el) => {
      el.classList.add('drag-container__not-moving')
      const _zIndex = Number(el.style.zIndex)
      if (_zIndex >= zIndex) {
        zIndex = _zIndex + 1
      }
    })

    element.style.zIndex = String(zIndex)

    return element
  }, [currentObject])

  useEffect(() => {
    if (movingObject) {
      movingObject.classList.add('drag-container__moving')
    } else {
      const notMovingComponents = containerRef.current!.querySelectorAll<HTMLDivElement>(`div.drag-container__not-moving`)
      notMovingComponents.forEach((el) => el.classList.remove('drag-container__not-moving'))
    }

    return () => {
      if (movingObject) {
        movingObject.classList.remove('drag-container__moving')
      }
    }
  }, [movingObject])

  const move = (x: number, y: number, isTouch = false) => {
    if (!movingObject) return

    const {
      height: containerHeight = 1,
      width: containerWidth = 1,
      x: containerX = 0,
      y: containerY = 0
    } = containerRef.current?.getBoundingClientRect() ?? {}

    let left = x - currentObject!.offset.offsetLeft - (isTouch ? containerX : 0)
    let top = y - currentObject!.offset.offsetTop - (isTouch ? containerY : 0)

    if (bounded) {
      const objectBounds = movingObject.getBoundingClientRect()

      const maxXLimit = containerWidth - objectBounds.width
      const maxYLimit = containerHeight - objectBounds.height

      left = boundedValue(0, x - currentObject!.offset.offsetLeft, maxXLimit)
      top = boundedValue(0, y - currentObject!.offset.offsetTop, maxYLimit)
    }

    movingObject.setAttribute('data-x-ratio', String(left / containerWidth))
    movingObject.setAttribute('data-y-ratio', String(top / containerHeight))

    movingObject.style.left = left + 'px'
    movingObject.style.top = top + 'px'
  }

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const { offsetX, offsetY } = e.nativeEvent
    move(offsetX, offsetY)
  }

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const { clientX, clientY } = e.touches[0]
    move(clientX, clientY, true)
  }

  const handleItemPress = useCallback((id: string, offset: Offset) => {
    setCurrentObject({ id, offset })
  }, [])

  const handleItemRelease = useCallback(() => {
    setCurrentObject(null)
  }, [])

  useEffect(() => {
    window.addEventListener('mouseleave', handleItemRelease)
    window.addEventListener('mouseup', handleItemRelease)
    window.addEventListener('blur', handleItemRelease)

    return () => {
      window.addEventListener('mouseleave', handleItemRelease)
      window.addEventListener('mouseup', handleItemRelease)
      window.addEventListener('blur', handleItemRelease)
    }
  }, [handleItemRelease])

  const handleResize = useCallback(() => {
    if (!containerRef.current) return

    const elements = containerRef.current.querySelectorAll<HTMLDivElement>(`div.drag-container`)
    elements.forEach((el) => {
      const { width = 0, height = 0 } = containerRef.current?.getBoundingClientRect() ?? {}
      el.style.left = Math.min(el.offsetLeft, width - el.clientWidth) + 'px'
      el.style.top = Math.min(el.offsetTop, height - el.clientHeight) + 'px'
    })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  return (
    <DragProvider.Provider value={{ handleItemPress, containerBounds }}>
      <div
        ref={containerRef}
        className={cn("relative overflow-hidden", className)}
        {...rest}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseUp={handleItemRelease}
        onTouchEnd={handleItemRelease}
        onMouseLeave={!bounded ? handleItemRelease : undefined}
      >
        {children}
      </div>
    </DragProvider.Provider>
  )
}

export default DragWrapper

