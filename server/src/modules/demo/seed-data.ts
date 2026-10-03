/** Fixture content for demo mode. Purely fictional people and groups. */

export const SEED_USERS = [
  { username: 'aisha', displayName: 'Aisha Rahman' },
  { username: 'bentan', displayName: 'Ben Tan' },
  { username: 'chloe', displayName: 'Chloe Lim' },
  { username: 'devan', displayName: 'Devan Kumar' },
  { username: 'emmaw', displayName: 'Emma Wong' },
  { username: 'farhan', displayName: 'Farhan Ali' },
] as const

type SeedUsername = (typeof SEED_USERS)[number]['username']
/** 'guest' stands for the visitor the sandbox is being created for. */
export type Actor = SeedUsername | 'guest'

/** Each guest gets a private copy of these groups (see demo.service.ts). */
interface SeedGroup {
  name: string
  owner: Actor
  members: Actor[]
  invites?: Actor[]
  requests?: Actor[]
  isPrivate: boolean
  tree: { isGrowing: boolean; progress: number; grown: number }
  comments: { author: Actor; message: string }[]
  chat: { from: Actor; text: string }[]
}

export const SEED_GROUPS: SeedGroup[] = [
  {
    name: 'Apollo Dev Team',
    owner: 'aisha',
    members: ['aisha', 'bentan', 'chloe', 'devan', 'guest'],
    isPrivate: false,
    tree: { isGrowing: true, progress: 60, grown: 3 },
    comments: [
      { author: 'devan', message: 'Milestone 2 shipped. Proud of this team!' },
      { author: 'chloe', message: 'Remember: demo rehearsal on Friday 3pm' },
      { author: 'bentan', message: 'Tree #4 is almost there, finish those tasks 🌱' },
    ],
    chat: [
      { from: 'aisha', text: 'Morning all! Sprint planning in 10 mins.' },
      { from: 'bentan', text: "On my way. I'll bring the backlog numbers." },
      { from: 'chloe', text: 'I pushed the chat pagination fix last night, can someone review?' },
      { from: 'devan', text: 'Looking at it now 👀' },
      { from: 'devan', text: 'LGTM, merged.' },
      { from: 'aisha', text: "Nice. I've assigned this week's tasks, check your group list." },
    ],
  },
  {
    name: 'CS Study Circle',
    owner: 'chloe',
    members: ['chloe', 'emmaw', 'farhan', 'guest'],
    isPrivate: false,
    tree: { isGrowing: false, progress: 100, grown: 1 },
    comments: [
      { author: 'emmaw', message: 'Library level 4, Tuesdays 7pm. Bring snacks.' },
      { author: 'farhan', message: 'Graph algorithms cheat sheet is in the drive' },
    ],
    chat: [
      { from: 'emmaw', text: 'Anyone want to go through past year papers this week?' },
      { from: 'farhan', text: "Yes please, I'm stuck on the DP questions" },
      { from: 'chloe', text: "Let's do Thursday. I'll plant a new tree so we can track it." },
    ],
  },
  {
    name: 'Morning Runners',
    owner: 'devan',
    members: ['devan', 'emmaw'],
    invites: ['guest'],
    isPrivate: true,
    tree: { isGrowing: true, progress: 20, grown: 5 },
    comments: [{ author: 'devan', message: '5km every weekday, no excuses 🏃' }],
    chat: [
      { from: 'devan', text: 'Rain tomorrow, moving to the indoor track.' },
      { from: 'emmaw', text: '👍' },
    ],
  },
  {
    // Owned by the guest so they can try the owner tools: approve a request, invite, manage.
    name: 'Weekend Hackers',
    owner: 'guest',
    members: ['guest', 'farhan'],
    requests: ['emmaw'],
    isPrivate: false,
    tree: { isGrowing: false, progress: 0, grown: 0 },
    comments: [{ author: 'farhan', message: 'Hackathon idea board goes here 💡' }],
    chat: [{ from: 'farhan', text: 'Thanks for setting this up! Shall we plant our first tree?' }],
  },
]

interface SeedTask {
  title: string
  description?: string
  /** Days from today; negative = overdue. */
  dueInDays?: number
  done?: boolean
}

export const GUEST_LISTS: { title: string; tasks: SeedTask[] }[] = [
  {
    title: 'Personal',
    tasks: [
      { title: 'Renew gym membership', dueInDays: -1 },
      {
        title: 'Plan weekend hike',
        description: 'Check the weather and pack the water filter',
        dueInDays: 3,
      },
      { title: 'Call grandma', done: true },
      { title: 'Read "Designing Data-Intensive Applications" ch. 5' },
    ],
  },
  {
    title: 'Coursework',
    tasks: [
      {
        title: 'Finish OS problem set 4',
        description: 'Questions 3-6 on scheduling',
        dueInDays: 0,
      },
      { title: 'Prepare slides for project presentation', dueInDays: 5 },
      { title: 'Submit lab report', done: true },
    ],
  },
]

export const GUEST_GROUP_TASKS: (SeedTask & { group: string })[] = [
  { group: 'Apollo Dev Team', title: 'Write integration tests for chat', dueInDays: 2 },
  { group: 'Apollo Dev Team', title: 'Review PR: SyncTree animations', dueInDays: 1 },
  { group: 'Apollo Dev Team', title: 'Update README screenshots', done: true },
  { group: 'CS Study Circle', title: 'Prepare 5 practice questions on graphs', dueInDays: 4 },
]

export const GUEST_DM = {
  from: 'bentan' as SeedUsername,
  messages: [
    'Hey, welcome to WorkSync 👋',
    'Try ticking off one of the Apollo Dev Team tasks. Every completed group task grows our SyncTree 🌱',
  ],
}
