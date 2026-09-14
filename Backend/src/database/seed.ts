import { pool } from '../config/database';
import { hashPassword } from '../utils/password';

async function seed() {
  try {
    console.log('Seeding database...');

    /* The seed password used to be a literal in this file. Because the file is
       committed, anyone who could read the repository knew the super admin's
       password. It now has to be supplied at seed time and is never written
       down here. */
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!seedPassword || seedPassword.trim().length < 12) {
      console.error(
        'SEED_ADMIN_PASSWORD must be set to at least 12 characters before seeding.\n' +
          'Example: SEED_ADMIN_PASSWORD="$(openssl rand -base64 24)" npm run seed'
      );
      process.exit(1);
    }

    const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || 'icodes001@gmail.com';

    // Create super admin user
    const superAdminPassword = await hashPassword(seedPassword);
    await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, phone_number, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [seedAdminEmail, superAdminPassword, 'Super', 'Admin', '+2341234567890', 'super_admin']
    );

    // Create departments
    await pool.query(
      `INSERT INTO departments (name, description)
       VALUES 
         ('Ushering', 'Church ushering department'),
         ('Media', 'Media and technology department'),
         ('Music', 'Music and worship department'),
         ('Protocol', 'Protocol and events department'),
         ('Children', 'Children ministry')
       ON CONFLICT (name) DO NOTHING`
    );

    // Create sample cell groups
    await pool.query(
      `INSERT INTO cell_groups (name, meeting_day, meeting_time, address, latitude, longitude)
       VALUES 
         ('Ikot Ekpene Cell', 'Thursday', '17:00', 'Ikot Ekpene Road, Uyo', 5.0339, 7.9110),
         ('Ewet Housing Cell', 'Wednesday', '18:00', 'Ewet Housing Estate, Uyo', 5.0154, 7.9345),
         ('Use Offot Cell', 'Tuesday', '17:30', 'Use Offot, Uyo', 5.0456, 7.9512)
       ON CONFLICT DO NOTHING`
    );

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
