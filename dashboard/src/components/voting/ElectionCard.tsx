import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { logAudit } from '../../lib/audit'
import type { Candidate, Election, ElectionResultRow, ElectionStatus } from '../../types'

const statusStyles: Record<ElectionStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  open: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-600',
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
  const isVotingWindowOpen = election.status === 'open' && now >= new Date(election.opens_at).getTime() && now <= new Date(election.closes_at).getTime()

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
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{election.title}</h3>
          {election.description && <p className="mt-1 text-sm text-gray-500">{election.description}</p>}
          <p className="mt-1 text-xs text-gray-400">
            {format(new Date(election.opens_at), 'MMM d, HH:mm')} – {format(new Date(election.closes_at), 'MMM d, HH:mm')}
            {election.is_anonymous && ' · Anonymous ballot'}
          </p>
        </div>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[election.status]}`}>
          {election.status}
        </span>
      </div>

      {isStaff && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {election.status === 'draft' && (
            <button onClick={() => updateStatus('open')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
              Open voting
            </button>
          )}
          {election.status === 'open' && (
            <button onClick={() => updateStatus('closed')} className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800">
              Close voting
            </button>
          )}
          <button
            onClick={() => setShowCandidateForm((v) => !v)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            {showCandidateForm ? 'Cancel' : '+ Add candidate'}
          </button>
        </div>
      )}

      {showCandidateForm && (
        <form onSubmit={handleAddCandidate} className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
          <input
            required
            aria-label="Position"
            placeholder="Position (e.g. President)"
            value={candidateForm.positionTitle}
            onChange={(e) => setCandidateForm({ ...candidateForm, positionTitle: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          />
          <input
            required
            aria-label="Candidate name"
            placeholder="Candidate name"
            value={candidateForm.displayName}
            onChange={(e) => setCandidateForm({ ...candidateForm, displayName: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          />
          <input
            aria-label="Candidate statement"
            placeholder="Statement (optional)"
            value={candidateForm.statement}
            onChange={(e) => setCandidateForm({ ...candidateForm, statement: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          />
          <button
            type="submit"
            disabled={candidateSaving}
            className="rounded-lg bg-kca-blue px-3 py-2 text-xs font-semibold text-white hover:bg-kca-dark disabled:opacity-60 sm:col-span-3"
          >
            {candidateSaving ? 'Saving…' : 'Save candidate'}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-4">
        {positions.length === 0 && <p className="text-sm text-gray-400">No candidates added yet.</p>}

        {positions.map(([positionTitle, positionCandidates]) => {
          const alreadyVoted = votedPositions.has(positionTitle)
          return (
            <div key={positionTitle}>
              <p className="text-sm font-semibold text-gray-800">{positionTitle}</p>
              <div className="mt-2 space-y-2">
                {positionCandidates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.display_name}</p>
                      {c.statement && <p className="text-xs text-gray-500">{c.statement}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {results && (
                        <span className="text-xs font-medium text-gray-500">{votesFor(c.id)} votes</span>
                      )}
                      {isVotingWindowOpen && !alreadyVoted && (
                        <button
                          onClick={() => castVote(positionTitle, c.id)}
                          disabled={votingFor === c.id}
                          className="rounded-lg bg-kca-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
                        >
                          {votingFor === c.id ? 'Voting…' : 'Vote'}
                        </button>
                      )}
                      {alreadyVoted && <span className="text-xs text-gray-400">Voted</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {voteError && <p className="mt-3 text-sm text-red-600">{voteError}</p>}

      {!results && election.status === 'open' && !isStaff && (
        <p className="mt-4 text-xs text-gray-400">Results are hidden until voting closes.</p>
      )}
      {resultsError && <p className="mt-3 text-sm text-red-600">{resultsError}</p>}
    </div>
  )
}
