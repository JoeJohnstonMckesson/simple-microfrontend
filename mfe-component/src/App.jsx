import './App.css'

const CARDS = [
  {
    id: 1,
    title: 'Lorem Ipsum Dolor',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    id: 2,
    title: 'Ut Enim Ad Minim',
    body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    id: 3,
    title: 'Duis Aute Irure',
    body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
  {
    id: 4,
    title: 'Excepteur Sint Occaecat',
    body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: 5,
    title: 'Curabitur Pretium',
    body: 'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio, et tempus feugiat. Nullam varius consequat magna.',
  },
  {
    id: 6,
    title: 'Pellentesque Habitant',
    body: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam.',
  },
]

function Card({ title, body }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  )
}

function App() {
  return (
    <div className="card-grid">
      {CARDS.map((card) => (
        <Card key={card.id} title={card.title} body={card.body} />
      ))}
    </div>
  )
}

export default App
