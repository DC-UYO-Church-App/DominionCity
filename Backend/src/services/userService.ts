import { query } from '../config/database';
import { User, UserRole } from '../types';
import { hashPassword, comparePassword } from '../utils/password';

export class UserService {
  static async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role?: UserRole;
    departmentId?: string;
    cellGroupId?: string;
    dateOfBirth?: Date;
    address?: string;
    profileImage?: string;
  }): Promise<Omit<User, 'password'>> {
    const hashedPassword = await hashPassword(userData.password);

    const result = await query(
      `INSERT INTO users (
        email, password, first_name, last_name, phone_number, 
        role, department_id, cell_group_id, date_of_birth, address, profile_image
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, email, first_name, last_name, phone_number, role, 
                department_id, cell_group_id, date_of_birth, address, 
                is_first_timer, join_date, profile_image, is_active, 
                created_at, updated_at`,
      [
        userData.email,
        hashedPassword,
        userData.firstName,
        userData.lastName,
        userData.phoneNumber,
        userData.role || UserRole.MEMBER,
        userData.departmentId,
        userData.cellGroupId,
        userData.dateOfBirth,
        userData.address,
        userData.profileImage,
      ]
    );

    return this.mapDbRowToUser(result.rows[0]);
  }

  static async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const result = await query(
      `SELECT id, email, first_name, last_name, phone_number, role, 
              department_id, cell_group_id, date_of_birth, address, 
              is_first_timer, join_date, profile_image, is_active, 
              created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToUser(result.rows[0]);
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToUserWithPassword(result.rows[0]);
  }

  /**
   * Case-insensitive email lookup, used by the password reset flow.
   *
   * Addresses are stored as typed, and the rest of the app matches exactly.
   * Recovery is the one place that must not fail silently over capitalisation:
   * someone who registered as "Grace@..." and types "grace@..." would
   * otherwise get the same neutral acknowledgement and never receive a link.
   */
  static async getUserByEmailInsensitive(email: string): Promise<User | null> {
    const result = await query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) ORDER BY created_at LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToUserWithPassword(result.rows[0]);
  }

  static async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const result = await query(
      `SELECT * FROM users WHERE phone_number = $1`,
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToUserWithPassword(result.rows[0]);
  }

  static async validateCredentials(
    email: string,
    password: string
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.getUserByEmail(email);

    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async validateCredentialsWithIdentifier(
    identifier: string,
    password: string
  ): Promise<Omit<User, 'password'> | null> {
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await this.getUserByEmail(identifier)
      : await this.getUserByPhoneNumber(identifier);

    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'password' | 'createdAt' | 'updatedAt'>>
  ): Promise<Omit<User, 'password'> | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.getUserById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, phone_number, role, 
                 department_id, cell_group_id, date_of_birth, address, 
                 is_first_timer, join_date, profile_image, is_active, 
                 created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToUser(result.rows[0]);
  }

  static async getAllUsers(filters?: {
    role?: UserRole;
    departmentId?: string;
    cellGroupId?: string;
    isActive?: boolean;
  }): Promise<Omit<User, 'password'>[]> {
    let queryText = `
      SELECT id, email, first_name, last_name, phone_number, role, 
             department_id, cell_group_id, date_of_birth, address, 
             is_first_timer, join_date, profile_image, is_active, 
             created_at, updated_at
      FROM users WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.role) {
      queryText += ` AND role = $${paramCount}`;
      values.push(filters.role);
      paramCount++;
    }

    if (filters?.departmentId) {
      queryText += ` AND department_id = $${paramCount}`;
      values.push(filters.departmentId);
      paramCount++;
    }

    if (filters?.cellGroupId) {
      queryText += ` AND cell_group_id = $${paramCount}`;
      values.push(filters.cellGroupId);
      paramCount++;
    }

    if (filters?.isActive !== undefined) {
      queryText += ` AND is_active = $${paramCount}`;
      values.push(filters.isActive);
      paramCount++;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, values);

    return result.rows.map(this.mapDbRowToUser);
  }

  static async deleteUser(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE users SET is_active = false WHERE id = $1`,
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private static mapDbRowToUser(row: any): Omit<User, 'password'> {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phoneNumber: row.phone_number,
      role: row.role as UserRole,
      departmentId: row.department_id,
      cellGroupId: row.cell_group_id,
      dateOfBirth: row.date_of_birth,
      address: row.address,
      isFirstTimer: row.is_first_timer,
      joinDate: row.join_date,
      profileImage: row.profile_image,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapDbRowToUserWithPassword(row: any): User {
    return {
      ...this.mapDbRowToUser(row),
      password: row.password,
    };
  }
}
