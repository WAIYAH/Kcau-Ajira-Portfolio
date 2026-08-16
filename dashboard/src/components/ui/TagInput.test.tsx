import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import TagInput from './TagInput'

// A small wrapper keeps state itself, the same way every real caller
// (Profile.tsx, the Opportunities composer) does -- TagInput is controlled.
function ControlledTagInput({ initial = [] as string[] }) {
  const [values, setValues] = useState<string[]>(initial)
  return <TagInput id="skills" values={values} onChange={setValues} placeholder="Add a skill" />
}

describe('TagInput', () => {
  it('adds a tag on Enter and clears the input', async () => {
    const user = userEvent.setup()
    render(<ControlledTagInput />)
    const input = screen.getByPlaceholderText('Add a skill')

    await user.type(input, 'React{Enter}')

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('adds a tag on comma', async () => {
    const user = userEvent.setup()
    render(<ControlledTagInput />)
    await user.type(screen.getByPlaceholderText('Add a skill'), 'Figma,')

    expect(screen.getByText('Figma')).toBeInTheDocument()
  })

  it('does not add a duplicate tag, case-insensitively', async () => {
    const user = userEvent.setup()
    render(<ControlledTagInput initial={['React']} />)
    await user.type(screen.getByPlaceholderText('Add a skill'), 'react{Enter}')

    expect(screen.getAllByText(/react/i)).toHaveLength(1)
  })

  it('removes a tag when its remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<ControlledTagInput initial={['React', 'TypeScript']} />)

    await user.click(screen.getByRole('button', { name: 'Remove React' }))

    expect(screen.queryByText('React')).not.toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('removes the last tag on Backspace when the input is empty', async () => {
    const user = userEvent.setup()
    render(<ControlledTagInput initial={['React', 'TypeScript']} />)

    await user.click(screen.getByPlaceholderText('Add a skill'))
    await user.keyboard('{Backspace}')

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument()
  })

  it('adds whatever is typed on blur, without requiring Enter', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <ControlledTagInput />
        <button type="button">elsewhere</button>
      </div>,
    )
    await user.type(screen.getByPlaceholderText('Add a skill'), 'Copywriting')
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(screen.getByText('Copywriting')).toBeInTheDocument()
  })

  it('calls onChange with the caller-controlled value, not internal state', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TagInput values={[]} onChange={onChange} placeholder="Add a skill" />)
    await user.type(screen.getByPlaceholderText('Add a skill'), 'React{Enter}')

    expect(onChange).toHaveBeenCalledWith(['React'])
  })
})
