import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { logAudit } from '@/lib/audit'
import type { Candidate, Election, ElectionResultRow, ElectionStatus } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const statusStyles: Record<ElectionStatus, string> = {
  draft: 'bg-fg/10 text-fg-muted',
  open: 'bg-success/15 text-success-ink',
  closed: 'bg-fg/10 text-fg-muted',
}

export default function ElectionCard({
  election,
  candidates,
  onChanged,
}: {
  election: Election
  candidates: Candidate[]
  onChanged: () => void
}) {
  const { isStaff } = useAuth()
  const [results, setResults] = useState<ElectionResultRow[] | null>(null)
  const [resultsError, setResultsError] = useState<string | null>(null)
  const [votedPositions, setVotedPositions] = useState<Set<string>>(new Set())
  const [voteError, setVoteError] = useState<string | null>(null)
  const [votingFor, setVotingFor] = useState<string | null>(null)

  const [showCandidateForm, setShowCandidateForm] = useState(false)
  const [candidateSaving, setCandidateSaving] = useState(false)
  const [candidateForm, setCandidateForm] = useState({ displayName: '', positionTitle: '', statement: '' })

  const now = Date.now()
  const isVotingWindowOpen =
    election.status === 'open' && now >= new Date(election.opens_at).getTime() && now <= new Date(election.closes_at).getTime()

  const positions = useMemo(() => {
    const map = new Map<string, Candidate[]>()
    for (const c of candidates) {
      if (!map.has(c.position_title)) map.set(c.position_title, [])
      map.get(c.position_title)!.push(c)
    }
    return Array.from(map.entries())
  }, [candidates])

  async function loadResults() {
    setResultsError(null)
    const { data, error } = await supabase.rpc('get_election_results', { p_election_id: election.id })
    if (error) setResultsError(error.message)
    else setResults((data as ElectionResultRow[]) ?? [])
  }

  useEffect(() => {
    if (election.status === 'closed' || isStaff) {
      loadResults()
    } else {
      setResults(null)
    }
  }, [election.status, isStaff])

  async function castVote(positionTitle: string, candidateId: string) {
    setVoteError(null)
    setVotingFor(candidateId)
    const { error } = await supabase.from('votes').insert({
      election_id: election.id,
      position_title: positionTitle,
      candidate_id: candidateId,
    })
    setVotingFor(null)

    if (error) {
      if (error.code === '23505') {
        setVotedPositions((prev) => new Set(prev).add(positionTitle))
        setVoteError("You've already voted for this position.")
      } else {
        setVoteError(error.message)
      }
      return
    }

    setVotedPositions((prev) => new Set(prev).add(positionTitle))
    if (isStaff) loadResults()
  }

  async function updateStatus(status: ElectionStatus) {
    const { error } = await supabase.from('elections').update({ status }).eq('id', election.id)
    if (!error) {
      logAudit('update_election_status', 'elections', election.id, { from: election.status, to: status })
      onChanged()
    }
  }

  async function handleAddCandidate(e: FormEvent) {
    e.preventDefault()
    setCandidateSaving(true)
    const { error } = await supabase.from('candidates').insert({
      election_id: election.id,
      display_name: candidateForm.displayName,
      position_title: candidateForm.positionTitle,
      statement: candidateForm.statement || null,
    })
    setCandidateSaving(false)
    if (!error) {
      setCandidateForm({ displayName: '', positionTitle: '', statement: '' })
      setShowCandidateForm(false)
      onChanged()
    }
  }

  function votesFor(candidateId: string) {
    return results?.find((r) => r.candidate_id === candidateId)?.vote_count ?? 0
  }

  return (
    <Card padding="lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-fg">{election.title}</h3>
          {election.description && <p className="mt-1 text-sm text-fg-muted">{election.description}</p>}
          <p className="mt-1 text-xs text-fg-subtle">
            {format(new Date(election.opens_at), 'MMM d, HH:mm')} – {format(new Date(election.closes_at), 'MMM d, HH:mm')}
            {election.is_anonymous && ' · Anonymous ballot'}
          </p>
        </div>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[election.status]}`}>
          {election.status}
        </span>
      </div>

      {isStaff && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {election.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => updateStatus('open')}
              className="bg-success-solid text-white hover:bg-success-solid"
            >
              Open voting
            </Button>
          )}
          {election.status === 'open' && (
            <Button size="sm" variant="secondary" onClick={() => updateStatus('closed')} className="bg-fg/10 text-fg hover:bg-fg/20">
              Close voting
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setShowCandidateForm((v) => !v)} className="border border-border">
            {showCandidateForm ? 'Cancel' : '+ Add candidate'}
          </Button>
        </div>
      )}

      {showCandidateForm && (
        <form onSubmit={handleAddCandidate} className="mt-4 grid gap-3 rounded-control bg-bg p-4 sm:grid-cols-3">
          <Input
            required
            aria-label="Position"
            placeholder="Position (e.g. President)"
            value={candidateForm.positionTitle}
            onChange={(e) => setCandidateForm({ ...candidateForm, positionTitle: e.target.value })}
          />
          <Input
            required
            aria-label="Candidate name"
            placeholder="Candidate name"
            value={candidateForm.displayName}
            onChange={(e) => setCandidateForm({ ...candidateForm, displayName: e.target.value })}
          />
          <Input
            aria-label="Candidate statement"
            placeholder="Statement (optional)"
            value={candidateForm.statement}
            onChange={(e) => setCandidateForm({ ...candidateForm, statement: e.target.value })}
          />
          <Button type="submit" loading={candidateSaving} size="sm" className="sm:col-span-3">
            {candidateSaving ? 'Saving…' : 'Save candidate'}
          </Button>
        </form>
      )}

      <div className="mt-4 space-y-4">
        {positions.length === 0 && <p className="text-sm text-fg-subtle">No candidates added yet.</p>}

        {positions.map(([positionTitle, positionCandidates]) => {
          const alreadyVoted = votedPositions.has(positionTitle)
          return (
            <div key={positionTitle}>
              <p className="text-sm font-semibold text-fg">{positionTitle}</p>
              <div className="mt-2 space-y-2">
                {positionCandidates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-control border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-fg">{c.display_name}</p>
                      {c.statement && <p className="text-xs text-fg-muted">{c.statement}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {results && <span className="text-xs font-medium text-fg-muted">{votesFor(c.id)} votes</span>}
                      {isVotingWindowOpen && !alreadyVoted && (
                        <Button size="sm" onClick={() => castVote(positionTitle, c.id)} loading={votingFor === c.id}>
                          {votingFor === c.id ? 'Voting…' : 'Vote'}
                        </Button>
                      )}
                      {alreadyVoted && <span className="text-xs text-fg-subtle">Voted</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {voteError && <p className="mt-3 text-sm text-danger-ink">{voteError}</p>}

      {!results && election.status === 'open' && !isStaff && (
        <p className="mt-4 text-xs text-fg-subtle">Results are hidden until voting closes.</p>
      )}
      {resultsError && <p className="mt-3 text-sm text-danger-ink">{resultsError}</p>}
    </Card>
  )
}
