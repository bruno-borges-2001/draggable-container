import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useDragger } from "../hooks";
import { cn } from "../utils/utils";

type ValidPosition = number | string | undefined

interface DraggableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  initialCoords?: { x: ValidPosition, y: ValidPosition },
  children: React.ReactNode
}

function parsePosition(position: ValidPosition) {
  if (!position) return ''

  if (typeof position === 'number') return position + 'px'

  return position
}

const DraggableContainer = ({ children, initialCoords, className, style = {}, ...rest }: DraggableContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const { handleItemPress } = useDragger()

  const [id, setId] = useState('')

  useEffect(() => {
    setId(uuidv4())
  }, [])

  useEffect(() => {
    if (!id || !initialCoords || !containerRef.current) return

    containerRef.current.style.left = parsePosition(initialCoords.x)
    containerRef.current.style.top = parsePosition(initialCoords.y)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    handleItemPress(id, { offsetLeft: e.nativeEvent.offsetX, offsetTop: e.nativeEvent.offsetY })
  }

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!containerRef.current) return
    const { clientX, clientY } = e.touches[0]
    const { x, y } = containerRef.current.getBoundingClientRect()

    handleItemPress(id, { offsetLeft: clientX - x, offsetTop: clientY - y })
  }

  return id && (
    <div
      ref={containerRef}
      data-id={id}
      style={{ ...style }}
      className={cn("drag-container", className)}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      {...rest}
    >
      {children}
    </div>
  )
}

export default DraggableContainer
