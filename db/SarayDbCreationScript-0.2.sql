-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema saray_appdb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema saray_appdb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `saray_appdb` DEFAULT CHARACTER SET utf8 ;
-- -----------------------------------------------------
-- Schema mobiliteitsapp1
-- -----------------------------------------------------
USE `saray_appdb` ;

-- -----------------------------------------------------
-- Table `mydb`.`Role`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `saray_appdb`.`Role` (
  `role_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`role_name`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`User`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `saray_appdb`.`User` (
  `userid` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `role_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`userid`),
  INDEX `fk_User_Role_idx` (`role_name` ASC),
  CONSTRAINT `fk_User_Role`
    FOREIGN KEY (`role_name`)
    REFERENCES `saray_appdb`.`Role` (`role_name`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `saray_appdb`.`Password`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `saray_appdb`.`Password` (
  `password` VARCHAR(45) NOT NULL,
  `creation_date` DATETIME NOT NULL,
  `userid` INT NOT NULL,
  PRIMARY KEY (`creation_date`, `password`, `userid`),
  INDEX `fk_Password_User1_idx` (`userid` ASC),
  CONSTRAINT `fk_Password_User1`
    FOREIGN KEY (`userid`)
    REFERENCES `saray_appdb`.`User` (`userid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `saray_appdb`.`Season`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `saray_appdb`.`Season` (
  `season_year` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`season_year`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `saray_appdb`.`Class`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `saray_appdb`.`Class` (
  `class_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`class_name`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `saray_appdb`.`Student`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `saray_appdb`.`Student` (
  `studentid` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(45) NOT NULL,
  `last_name` VARCHAR(45) NULL,
  `birth_date` DATE NULL,
  `season_year` VARCHAR(45) NOT NULL,
  `class_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`studentid`),
  INDEX `fk_Student_Season1_idx` (`season_year` ASC),
  INDEX `fk_Student_Class1_idx` (`class_name` ASC),
  CONSTRAINT `fk_Student_Season1`
    FOREIGN KEY (`season_year`)
    REFERENCES `saray_appdb`.`Season` (`season_year`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Student_Class1`
    FOREIGN KEY (`class_name`)
    REFERENCES `saray_appdb`.`Class` (`class_name`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `saray_appdb`.`AttendanceType`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `saray_appdb`.`AttendanceType` (
  `attendance_type_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`attendance_type_name`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `saray_appdb`.`Program`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `saray_appdb`.`Program` (
  `program_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`program_name`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `saray_appdb`.`Attendance`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `saray_appdb`.`Attendance` (
  `studentid` INT NOT NULL,
  `date` DATE NOT NULL,
  `attendance_type_name` VARCHAR(45) NOT NULL,
  `program_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`studentid`, `date`, `program_name`),
  INDEX `fk_Attendance_AttendanceType1_idx` (`attendance_type_name` ASC),
  INDEX `fk_Attendance_Program1_idx` (`program_name` ASC),
  CONSTRAINT `fk_Attendance_Student1`
    FOREIGN KEY (`studentid`)
    REFERENCES `saray_appdb`.`Student` (`studentid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Attendance_AttendanceType1`
    FOREIGN KEY (`attendance_type_name`)
    REFERENCES `saray_appdb`.`AttendanceType` (`attendance_type_name`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Attendance_Program1`
    FOREIGN KEY (`program_name`)
    REFERENCES `saray_appdb`.`Program` (`program_name`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
