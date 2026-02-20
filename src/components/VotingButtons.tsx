'use client'

import { useState } from 'react'

interface VotingButtonsProps {
  captionId: string
  initialVoteCounts: {
    upvotes: number
    downvotes: number
    neutrals: number
  }
  userVote: number | null
  isLoggedIn: boolean
  onVoteChange?: (newVoteCounts: any, userVote: number | null) => void
}

export default function VotingButtons({
  captionId,
  initialVoteCounts,
  userVote,
  isLoggedIn,
  onVoteChange
}: VotingButtonsProps) {
  const [voteCounts, setVoteCounts] = useState(initialVoteCounts)
  const [currentUserVote, setCurrentUserVote] = useState(userVote)
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (voteValue: number) => {
    if (!isLoggedIn) {
      alert('Please log in to vote on captions')
      return
    }

    if (isVoting) return

    setIsVoting(true)

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caption_id: captionId,
          vote_value: voteValue
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        const newVoteCounts = { ...voteCounts }

        // Remove previous vote from counts if it existed
        if (currentUserVote !== null) {
          if (currentUserVote > 0) newVoteCounts.upvotes--
          else if (currentUserVote < 0) newVoteCounts.downvotes--
          else newVoteCounts.neutrals--
        }

        // Add new vote to counts
        if (voteValue > 0) newVoteCounts.upvotes++
        else if (voteValue < 0) newVoteCounts.downvotes++
        else newVoteCounts.neutrals++

        setVoteCounts(newVoteCounts)
        setCurrentUserVote(voteValue)

        // Notify parent component if callback provided
        if (onVoteChange) {
          onVoteChange(newVoteCounts, voteValue)
        }

      } else {
        alert(result.error || 'Failed to submit vote')
      }
    } catch (error) {
      console.error('Vote submission error:', error)
      alert('Failed to submit vote. Please try again.')
    } finally {
      setIsVoting(false)
    }
  }

  const getButtonClass = (voteType: 'up' | 'down', baseClasses: string) => {
    let activeClasses = ''

    if (voteType === 'up' && currentUserVote === 1) {
      activeClasses = 'bg-green-100 text-green-700 border-green-300'
    } else if (voteType === 'down' && currentUserVote === -1) {
      activeClasses = 'bg-red-100 text-red-700 border-red-300'
    }

    return `${baseClasses} ${activeClasses}`
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Upvote Button */}
      <button
        onClick={() => handleVote(1)}
        disabled={isVoting || !isLoggedIn}
        className={getButtonClass(
          'up',
          `flex items-center space-x-1 px-3 py-1 rounded-lg border text-sm font-medium transition-all duration-200 ${
            isLoggedIn
              ? 'hover:bg-green-50 hover:border-green-300 active:scale-95'
              : 'opacity-50 cursor-not-allowed'
          } ${
            isVoting ? 'opacity-50 cursor-not-allowed' : ''
          }`
        )}
        title={isLoggedIn ? 'Upvote this caption' : 'Login to vote'}
      >
        <span className="text-lg">👍</span>
        <span>{voteCounts.upvotes}</span>
      </button>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote(-1)}
        disabled={isVoting || !isLoggedIn}
        className={getButtonClass(
          'down',
          `flex items-center space-x-1 px-3 py-1 rounded-lg border text-sm font-medium transition-all duration-200 ${
            isLoggedIn
              ? 'hover:bg-red-50 hover:border-red-300 active:scale-95'
              : 'opacity-50 cursor-not-allowed'
          } ${
            isVoting ? 'opacity-50 cursor-not-allowed' : ''
          }`
        )}
        title={isLoggedIn ? 'Downvote this caption' : 'Login to vote'}
      >
        <span className="text-lg">👎</span>
        <span>{voteCounts.downvotes}</span>
      </button>

      {/* Vote Summary */}
      <div className="text-xs text-gray-500 flex items-center space-x-1">
        <span>{voteCounts.upvotes + voteCounts.downvotes + voteCounts.neutrals}</span>
        <span>votes</span>
        {voteCounts.upvotes + voteCounts.downvotes > 0 && (
          <span className="ml-1">
            ({Math.round((voteCounts.upvotes / (voteCounts.upvotes + voteCounts.downvotes)) * 100)}% up)
          </span>
        )}
      </div>
    </div>
  )
}