import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const games = [
    {
      id: 'wordle',
      name: 'Wordle',
      description: 'Guess the 5-letter word in 6 tries.',
      iconUrl: 'https://api.retrogradenews.app/assets/icons/wordle.png'
    },
    {
      id: 'boggle',
      name: 'Boggle',
      description: 'Find as many words as you can in a 4x4 grid.',
      iconUrl: 'https://api.retrogradenews.app/assets/icons/boggle.png'
    },
    {
      id: 'crossword',
      name: 'Crossword',
      description: 'Solve the daily crossword puzzle.',
      iconUrl: 'https://api.retrogradenews.app/assets/icons/crossword.png'
    },
    {
      id: 'quiz',
      name: 'Daily Quiz',
      description: 'Test your knowledge with 5 daily questions.',
      iconUrl: 'https://api.retrogradenews.app/assets/icons/quiz.png'
    },
    {
      id: 'sudoku',
      name: 'Sudoku',
      description: 'Fill the 9x9 grid with numbers 1-9.',
      iconUrl: 'https://api.retrogradenews.app/assets/icons/sudoku.png'
    },
    {
      id: 'wordsearch',
      name: 'Word Search',
      description: 'Find the hidden words in the grid.',
      iconUrl: 'https://api.retrogradenews.app/assets/icons/wordsearch.png'
    }
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: game,
      create: game
    });
  }

  console.log('✅ Games seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
